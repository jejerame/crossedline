import rawDb from "../rude-response-db-v4.json";

export interface RecommendedPrinciple {
  principle_label: string;
  principle_short: string;
  principle_display: string;
  principle_reason: string;
}

export interface Reply {
  reply_id: string;
  tone: string;
  text: string;
  text_banmal: string | null;
  principle_label: string;
  principle_short: string;
  principle_display: string;
  principle_reason: string;
  risk_level: string;
  use_when: string;
  avoid_when: string;
  caution: string;
  source_basis: string;
}

export interface Situation {
  id: string;
  category: string;
  situation_title: string;
  rude_phrase_examples: string[];
  keywords: string[];
  rude_type: string;
  relationship_context: string;
  power_gap: string;
  recommended_principles: RecommendedPrinciple[];
  has_banmal_option: boolean;
  replies: Reply[];
}

const db = (rawDb as { situations: Situation[] }).situations;

export const DISCLAIMER = (rawDb as { disclaimer: string }).disclaimer;

export const PRINCIPLES = (rawDb as { principles: RecommendedPrinciple[] }).principles;

export function getSituationById(id: string): Situation | null {
  return db.find((s) => s.id === id) ?? null;
}

export function getPrincipleByLabel(label: string): RecommendedPrinciple | null {
  return PRINCIPLES.find((p) => p.principle_label === label) ?? null;
}

// 카테고리 선택 시 상황을 바로 고를 수 있는 칩 목록 (자유 입력 매칭을 거치지 않는 직접 선택용)
export function getSituationsByDisplayCategory(displayCategory: string): Situation[] {
  const dbCategory = CATEGORY_MAP[displayCategory];
  if (!dbCategory) return [];
  return db.filter((s) => s.category === dbCategory);
}

// Claude API에 보낼 situation 컨텍스트 (멘트 본문은 빼고 매칭에 필요한 정보만)
export function buildMatchContext(displayCategory?: string) {
  const dbCategory = displayCategory ? CATEGORY_MAP[displayCategory] : undefined;
  const pool = dbCategory ? db.filter((s) => s.category === dbCategory) : db;
  return pool.map((s) => ({
    id: s.id,
    situation_title: s.situation_title,
    rude_phrase_examples: s.rude_phrase_examples,
    keywords: s.keywords,
    rude_type: s.rude_type,
  }));
}

// 화면 표시용 카테고리 -> DB 카테고리 매핑
export const CATEGORY_MAP: Record<string, string> = {
  "직장/상사": "직장/상사",
  "친척/명절": "가족/친척/명절",
  "외모/사생활": "외모/사생활",
  "친구/지인": "친구/지인",
  "고객/진상": "고객/진상",
};

// 카테고리를 선택하지 않았을 때 표시되는 항목 (전체 DB에서 검색)
export const CATEGORY_PLACEHOLDER = "카테고리 선택";

export const CATEGORY_OPTIONS = [CATEGORY_PLACEHOLDER, ...Object.keys(CATEGORY_MAP)];

// 톤 선택
export const TONE_PLACEHOLDER = "톤 선택";
export const TONE_OPTIONS = [TONE_PLACEHOLDER, "정중하게", "차갑게", "선 긋기"];

// 검색어 추천 콤보 옵션
export const SEARCH_SUGGESTIONS = [
  "살쪘네",
  "결혼 안 하냐, 결혼",
  "요즘 애들은",
  "장난인데 왜 그래",
  "상사가 꼽줌",
];

function normalize(text: string): string {
  return text.replace(/\s+/g, "");
}

// 어미 변화(쪘네/쪘다 등)를 허용하는 느슨한 매칭
// 단, 2글자 이하 문자열은 끝글자를 자르면 1글자만 남아 무관한 단어에도 걸리므로 fuzzy 매칭 대상에서 제외
function isRelated(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  if (a.length <= 2 || b.length <= 2) return false;
  const a2 = a.slice(0, -1);
  const b2 = b.slice(0, -1);
  return a.includes(b2) || b.includes(a2) || a2 === b2;
}

function scoreSituation(query: string, situation: Situation): number {
  const q = normalize(query);
  if (!q) return 0;
  let score = 0;
  for (const kw of situation.keywords) {
    if (isRelated(q, normalize(kw))) score += 1;
  }
  for (const ex of situation.rude_phrase_examples) {
    if (isRelated(q, normalize(ex))) score += 2;
  }
  return score;
}

export function findSituation(query: string, displayCategory: string): Situation | null {
  const dbCategory = CATEGORY_MAP[displayCategory];
  const pool = dbCategory ? db.filter((s) => s.category === dbCategory) : db;

  let best: Situation | null = null;
  let bestScore = 0;
  for (const situation of pool) {
    const score = scoreSituation(query, situation);
    if (score > bestScore) {
      bestScore = score;
      best = situation;
    }
  }
  return best;
}

export interface ResultCard {
  quoteMain: string;
  quoteSub: string;
  principleTitle: string;
  principleSub2: string;
  riskLevel: string;
  avoidWhen: string;
  fallbackNotice?: string;
}

// 답변 일부는 자연스러운 표현을 위해 tone 필드 자체가 "되묻기", "농담으로 받아치기" 등
// 고유한 값으로 바뀌어 있다. 톤 선택 드롭다운(정중하게/차갑게/선 긋기)과의 매칭을 위해
// reply_id의 -R1/-R2/-R3 순번을 기준으로 톤 버킷을 고정한다 (db 전체에서 일관된 규칙).
const TONE_BUCKET_BY_SUFFIX: Record<string, string> = {
  "1": "정중하게",
  "2": "차갑게",
  "3": "선 긋기",
};

function toneBucket(replyId: string): string | null {
  const suffix = replyId.match(/-R(\d+)$/)?.[1];
  return suffix ? TONE_BUCKET_BY_SUFFIX[suffix] ?? null : null;
}

export function buildResultCard(
  situation: Situation,
  replyIndex: number,
  tone?: string,
  useBanmal?: boolean,
  fallbackNotice?: string
): ResultCard {
  let replies = situation.replies;
  if (tone && tone !== TONE_PLACEHOLDER) {
    const filtered = replies.filter((r) => toneBucket(r.reply_id) === tone);
    if (filtered.length > 0) replies = filtered;
  }
  const reply = replies[replyIndex % replies.length];
  const useBanmalText = useBanmal && reply.text_banmal;
  return {
    quoteMain: useBanmalText ? reply.text_banmal! : reply.text,
    quoteSub: reply.principle_reason,
    principleTitle: reply.principle_short,
    principleSub2: reply.principle_display,
    riskLevel: reply.risk_level,
    avoidWhen: reply.avoid_when,
    ...(fallbackNotice ? { fallbackNotice } : {}),
  };
}
