"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import "../styles/seonneomne.css";
import {
  CATEGORY_OPTIONS,
  CATEGORY_PLACEHOLDER,
  TONE_OPTIONS,
  TONE_PLACEHOLDER,
  SEARCH_SUGGESTIONS,
  DISCLAIMER,
  findSituation,
  buildResultCard,
  getSituationById,
  getSituationsByDisplayCategory,
  type ResultCard,
  type Situation,
} from "../lib/responses";
import { canUseSearch, consumeSearch } from "../lib/usageLimit";

const FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSePPV-oZtKpQjFSpjH-fS_Nv3deoY9w3sO-S4RHclFZEFmfCw/viewform?usp=publish-editor";

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchChipLabel, setSearchChipLabel] = useState(SEARCH_SUGGESTIONS[0]);
  const [categoryLabel, setCategoryLabel] = useState(CATEGORY_OPTIONS[0]); // "카테고리 선택" (전체 검색)
  const [toneLabel, setToneLabel] = useState(TONE_OPTIONS[0]); // "톤 선택" (전체 순환)
  const [openChip, setOpenChip] = useState<"category" | "tone" | null>(null);
  const [card, setCard] = useState<ResultCard | null>(null);
  const [currentSituation, setCurrentSituation] = useState<Situation | null>(null);
  const [replyIndex, setReplyIndex] = useState(0);
  const [useBanmal, setUseBanmal] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showInfoTip, setShowInfoTip] = useState(false);
  const [showFeedbackTip, setShowFeedbackTip] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const screenRef = useRef<HTMLElement>(null);

  const showSituation = (situation: Situation, fallbackNotice?: string) => {
    setCurrentSituation(situation);
    setReplyIndex(0);
    setUseBanmal(false);
    setCard(buildResultCard(situation, 0, toneLabel, false, fallbackNotice));
    setNotice(null);
  };

  const handleSearch = async () => {
    if (!canUseSearch()) {
      setCard(null);
      setNotice("오늘의 추천은 다 받았어요! 내일 다시 와주세요");
      return;
    }
    if (toneLabel === TONE_PLACEHOLDER) {
      setCard(null);
      setNotice("톤을 먼저 선택해 주세요");
      return;
    }
    if (categoryLabel === CATEGORY_PLACEHOLDER) {
      setCard(null);
      setNotice("적절한 카테고리를 먼저 선택해 주세요");
      return;
    }
    const keyword = query.trim() || searchChipLabel;
    const found = findSituation(keyword, categoryLabel);
    if (found) {
      consumeSearch();
      showSituation(found);
      return;
    }

    // 로컬 키워드 매칭 실패 — Claude API로 보완 매칭 시도
    setIsSearching(true);
    setCard(null);
    setNotice(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: keyword, category: categoryLabel }),
      });
      if (!res.ok) throw new Error("match api failed");
      const result = (await res.json()) as {
        situation_id: string | null;
        principle_label: string | null;
        confidence?: "high" | "medium" | "low";
      };

      // confidence가 high가 아니면 엉뚱한 상황을 정확히 매칭된 것처럼 보여줄 수 있어 fallback으로 처리
      const matched =
        result.situation_id && result.confidence === "high"
          ? getSituationById(result.situation_id)
          : null;
      if (matched) {
        consumeSearch();
        showSituation(matched);
        return;
      }

      // 카테고리는 선택했지만 그 안에 맞는 상황이 없는 경우 — 대표 예시로 얼버무리지 않고 명확히 안내
      setCard(null);
      setNotice("이 카테고리에는 맞는 상황을 찾지 못했어요. 다른 카테고리를 선택해 보세요");
    } catch {
      setCard(null);
      setNotice("이 카테고리에는 맞는 상황을 찾지 못했어요. 다른 카테고리를 선택해 보세요");
    } finally {
      setIsSearching(false);
    }
  };

  // 카테고리 칩에서 상황을 바로 클릭했을 때 — 키워드 매칭/Claude API 거치지 않고 즉시 결과 표시
  const handlePickSituation = (situation: Situation) => {
    if (!canUseSearch()) {
      setCard(null);
      setNotice("오늘의 추천은 다 받았어요! 내일 다시 와주세요");
      return;
    }
    // 입력창에 남은 검색어로 다시 검색하면 이 선택과 다른 결과가 나올 수 있어 비워둠
    setQuery("");
    consumeSearch();
    showSituation(situation);
  };

  const handleToggleBanmal = () => {
    if (!currentSituation) return;
    const next = !useBanmal;
    setUseBanmal(next);
    setCard(buildResultCard(currentSituation, replyIndex, toneLabel, next, card?.fallbackNotice));
  };

  const handleSave = async () => {
    if (!card || !screenRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(screenRef.current, {
      backgroundColor: "#fff7fa",
      scale: 2,
      useCORS: true,
      onclone: (doc) => {
        // CSS 변수 미지원 → hex로 직접 지정
        const screen = doc.querySelector(".seon-screen") as HTMLElement;
        if (screen) {
          screen.style.background =
            "linear-gradient(180deg, #fff7fa 0%, #fdecf2 44%, #fdeaf1 100%)";
        }
        // input 수직 정렬 보정 (html2canvas는 line-height 미적용 → padding으로 대신)
        const input = doc.querySelector(".seon-input") as HTMLElement;
        if (input) {
          input.style.paddingTop = "13px";
          input.style.boxSizing = "border-box";
          input.style.lineHeight = "normal";
        }
      },
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "seonneomne.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleNextReply = () => {
    if (!currentSituation) return;
    const nextIndex = replyIndex + 1;
    setReplyIndex(nextIndex);
    // 톤 필터 없이 순환 — 특정 톤 멘트가 1개뿐이면 아무 변화 없어 보이는 문제 방지
    setCard(buildResultCard(currentSituation, nextIndex, undefined, useBanmal, card?.fallbackNotice));
  };

  const handleShare = async () => {
    if (!card) return;
    try {
      await navigator.share({
        title: "선넘네",
        text: card.quoteMain,
        url: window.location.href,
      });
    } catch {
      // 사용자 취소 또는 미지원 환경 무시
    }
  };

  // disclaimer 원문에서 강조할 두 구간만 찾아서 강조 스타일로 감싸기
  const emphasis1 = "정답을 보장하지 않아요";
  const emphasis2 = "내 상황에 맞게 다듬어서";
  const idx1 = DISCLAIMER.indexOf(emphasis1);
  const idx2 = DISCLAIMER.indexOf(emphasis2);
  const disclaimerParts =
    idx1 >= 0 && idx2 > idx1
      ? {
          before: DISCLAIMER.slice(0, idx1),
          mid: DISCLAIMER.slice(idx1 + emphasis1.length, idx2),
          after: DISCLAIMER.slice(idx2 + emphasis2.length),
        }
      : null;

  // 카테고리를 아직 안 골랐을 때 드롭다운에 미리 보여줄 기본 카테고리 (목록의 첫 실제 카테고리)
  const previewCategory =
    categoryLabel === CATEGORY_PLACEHOLDER ? CATEGORY_OPTIONS[1] : categoryLabel;

  return (
    <main ref={screenRef} className="seon-screen" onClick={() => { setOpenChip(null); setShowInfoTip(false); setShowFeedbackTip(false); }}>
      <div className="seon-bg-watermark" aria-hidden="true">
        <div className="seon-wm-dots">•••</div>
      </div>

      <div className="seon-feedback-wrap" onClick={(e) => e.stopPropagation()}>
        <a
          className="seon-feedback-btn"
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="피드백 보내기"
          onMouseEnter={() => setShowFeedbackTip(true)}
          onMouseLeave={() => setShowFeedbackTip(false)}
        >
          <span className="seon-icon-mail" aria-hidden="true">💌</span>
        </a>
        {showFeedbackTip && (
          <div className="seon-feedback-tip" role="tooltip">
            피드백 보내기
          </div>
        )}
      </div>

      <Image
        className="seon-logo"
        src="/long_nukki.png"
        alt="선넘네 로고"
        width={198}
        height={58}
        priority
      />
      <p className="seon-subtitle">무례한 말에 대응할 수 있는 한 문장 검색</p>
      <p className="seon-top-disclaimer">
        {disclaimerParts ? (
          <>
            {disclaimerParts.before}
            <span className="seon-disclaimer-strong">{emphasis1}</span>
            {disclaimerParts.mid}
            <span className="seon-disclaimer-strong">{emphasis2}</span>
            {disclaimerParts.after}
          </>
        ) : (
          DISCLAIMER
        )}
      </p>

      <div className="seon-search-label">
        <span className="seon-icon-search" aria-hidden="true" />
        <span>선넘는 말을 검색해 보세요</span>
      </div>

      <section className="seon-search-card" aria-label="검색어 입력">
        <Image
          className="seon-search-mascot"
          src="/girl1.png"
          alt=""
          aria-hidden="true"
          width={906}
          height={821}
        />
        <input
          className="seon-input"
          placeholder="예: 결혼 안 하냐, 결혼"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <div
          className="seon-info-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="seon-info-btn"
            type="button"
            onMouseEnter={() => setShowInfoTip(true)}
            onMouseLeave={() => setShowInfoTip(false)}
            onClick={() => setShowInfoTip((v) => !v)}
            aria-label="개인정보 안내"
          >
            !
          </button>
          {showInfoTip && (
            <div className="seon-info-tip" role="tooltip">
              검색어는 저장되지 않습니다
            </div>
          )}
        </div>
        <button className="seon-input-button" type="button" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? "..." : "입력"}
        </button>
      </section>

      <div className="seon-tag-chips" aria-label="검색어 추천">
        {SEARCH_SUGGESTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={
              "seon-tag-chip" +
              (option === searchChipLabel ? " is-active" : "")
            }
            onClick={(e) => {
              e.stopPropagation();
              setSearchChipLabel(option);
              setQuery(option);
            }}
          >
            #{option}
          </button>
        ))}
      </div>

      <section className="seon-chips" aria-label="검색 조건">
        {/* 톤 선택 - 왼쪽 */}
        <div className="seon-chip-wrap seon-chip-right">
          <button
            className="seon-chip"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenChip(openChip === "tone" ? null : "tone");
            }}
          >
            <span className="seon-icon-tone" aria-hidden="true" />
            <span className="seon-chip-label">{toneLabel}</span>
            <span className="seon-chevron" aria-hidden="true" />
          </button>
          {openChip === "tone" && (
            <div className="seon-dropdown" onClick={(e) => e.stopPropagation()}>
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={
                    "seon-dropdown-item" +
                    (option === toneLabel ? " is-active" : "")
                  }
                  onClick={() => {
                    setToneLabel(option);
                    setOpenChip(null);
                    setNotice(null);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 카테고리 선택 - 오른쪽 */}
        <div className="seon-chip-wrap seon-chip-right">
          <button
            className="seon-chip"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenChip(openChip === "category" ? null : "category");
            }}
          >
            <span className="seon-icon-user" aria-hidden="true" />
            <span className="seon-chip-label">{categoryLabel}</span>
            <span className="seon-chevron" aria-hidden="true" />
          </button>
          {openChip === "category" && (
            <div className="seon-dropdown" onClick={(e) => e.stopPropagation()}>
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={
                    "seon-dropdown-item" +
                    (option === categoryLabel ? " is-active" : "")
                  }
                  onClick={() => {
                    setCategoryLabel(option);
                    setNotice(null);
                    // 카테고리만 바꾼 거면 드롭다운을 안 닫고 아래 상황 목록을 바로 갈아끼움.
                    // 바깥(입력 버튼 포함)을 클릭하면 main의 onClick이 버블링돼 자동으로 닫힘.
                    if (option === CATEGORY_PLACEHOLDER) setOpenChip(null);
                  }}
                >
                  {option}
                </button>
              ))}
              {/* 카테고리를 아직 안 골랐어도 첫 카테고리 상황 목록을 미리 보여줌 — 처음 열었을 때부터 "세세한 항목이 있다"는 걸 바로 알 수 있게 */}
              <div className="seon-situation-picker">
                <div className="seon-situation-picker-label">
                  {previewCategory} 상황 바로 고르기
                </div>
                {getSituationsByDisplayCategory(previewCategory).map((situation) => (
                  <button
                    key={situation.id}
                    type="button"
                    className="seon-dropdown-item seon-situation-item"
                    onClick={() => {
                      setOpenChip(null);
                      if (categoryLabel === CATEGORY_PLACEHOLDER) setCategoryLabel(previewCategory);
                      handlePickSituation(situation);
                    }}
                  >
                    {situation.situation_title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 반말 토글 - has_banmal_option인 상황에서만 노출 */}
        {currentSituation?.has_banmal_option && (
          <button
            className="seon-banmal-toggle"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleBanmal();
            }}
          >
            {useBanmal ? "존댓말로 보기" : "반말로 보기"}
          </button>
        )}
      </section>

      <div className="seon-result-section">
        <div className="seon-result-label">
          <span aria-hidden="true">✧</span>
          <span>검색 결과는...</span>
        </div>

        {card?.fallbackNotice && (
          <p className="seon-fallback-notice">{card.fallbackNotice}</p>
        )}

        {card && (
          <section className="seon-principle">
            <div className="seon-badge">♧ 원칙</div>
            <h2>{card.principleTitle}</h2>
            <p>{card.principleSub2}</p>
          </section>
        )}

        <section className="seon-quote-card">
          {card ? (
            <>
              <span className="seon-quote-open" aria-hidden="true">“</span>
              <span className="seon-quote-close" aria-hidden="true">”</span>
              <Image
                className="seon-quote-mascot"
                src="/girl.png"
                alt=""
                aria-hidden="true"
                width={435}
                height={516}
              />
              <div className="seon-badge">이렇게 접근해볼 수 있어요</div>
              <p className="seon-quote-main">{card.quoteMain}</p>
              <p className="seon-quote-sub">{card.quoteSub}</p>
              <p className="seon-quote-meta">
                위험도: {card.riskLevel}
              </p>
              <p className="seon-quote-warning">
                ⚠ 이럴 때는 피하세요: {card.avoidWhen}
              </p>
            </>
          ) : isSearching ? (
            <p className="seon-quote-notice">찾아보는 중...</p>
          ) : notice ? (
            <p className="seon-quote-notice">{notice}</p>
          ) : (
            <Image
              className="seon-quote-placeholder"
              src="/question.png"
              alt="검색 전 안내"
              width={662}
              height={898}
            />
          )}
        </section>

        {card && (
          <div className="seon-actions">
            <button className="seon-main-action" type="button" onClick={handleNextReply}>
              다른 멘트 보기
            </button>
            <div className="seon-actions-row">
              <button className="seon-main-action" type="button" onClick={handleShare}>
                <span aria-hidden="true">↗</span>
                공유하기
              </button>
              <button className="seon-main-action is-secondary" type="button" onClick={handleSave}>
                <span aria-hidden="true">↓</span>
                저장하기
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
