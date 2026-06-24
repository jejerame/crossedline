import { NextResponse } from "next/server";
import { buildMatchContext } from "../../../lib/responses";

interface MatchResult {
  situation_id: string | null;
  principle_label: string | null;
  confidence: "high" | "medium" | "low";
}

function isMatchResult(value: unknown): value is MatchResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (v.situation_id === null || typeof v.situation_id === "string") &&
    (v.principle_label === null || v.principle_label === undefined || typeof v.principle_label === "string") &&
    (v.confidence === undefined || typeof v.confidence === "string")
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

  const { query, category } = (await request.json()) as { query?: string; category?: string };
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "query가 필요합니다." }, { status: 400 });
  }

  const situations = buildMatchContext(category);

  const instruction =
    "너는 한국어 무례한 말 대응 앱 '선넘네'의 매칭 엔진이다. " +
    "사용자가 자유롭게 입력한 문장을 보고, 주어진 situations 목록 중 가장 가까운 situation_id 하나를 고르거나, " +
    "확신이 낮으면 situation_id는 null로 두고 가장 가까운 principle_label만 골라라. " +
    "절대 다른 설명 없이 아래 형식의 JSON 객체 하나만 출력해라: " +
    '{"situation_id": "F001" 또는 null, "principle_label": "원칙 이름" 또는 null, "confidence": "high" | "medium" | "low"}\n\n' +
    `situations:\n${JSON.stringify(situations)}`;

  // situations 목록은 매 요청마다 거의 동일하게 반복되는 큰 블록 → prompt caching으로 비용 절감
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "prompt-caching-2024-07-31",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: [
        {
          type: "text",
          text: instruction,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: `사용자 입력: ${query.trim()}` }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Claude API 호출 실패" }, { status: 502 });
  }

  const data = await response.json();
  const text = data?.content?.[0]?.text ?? "";

  let parsed: unknown;
  try {
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    return NextResponse.json({ error: "응답 파싱 실패" }, { status: 502 });
  }

  if (!isMatchResult(parsed)) {
    return NextResponse.json({ error: "응답 형식 오류" }, { status: 502 });
  }

  return NextResponse.json(parsed satisfies MatchResult);
}
