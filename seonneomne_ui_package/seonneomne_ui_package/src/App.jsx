import './seonneomne.css';

export default function App() {
  return (
    <main className="seon-screen" aria-label="선넘네 prototype screen">
      <div className="status-bar" aria-hidden="true">
        <span className="time">9:41</span>
        <span className="system-icons">▮▮▮ ︶ ▱</span>
      </div>

      <div className="bg-watermark" aria-hidden="true">
        <div className="wm-dots">•••</div>
        <div className="wm-slash" />
      </div>

      <button className="bell" aria-label="알림">
        ♧
      </button>

      {/* 실제 구현에서는 이 텍스트 대신 logo-seonneomne.svg를 img로 넣는 것을 추천 */}
      <h1 className="logo-fallback">선넘네</h1>
      <p className="subtitle">무례한 말에 대응할 수 있는 한 문장 검색</p>

      <div className="search-label">
        <span className="icon-search" aria-hidden="true" />
        <span>선넘는 말을 검색해 보세요</span>
      </div>

      <section className="search-card" aria-label="검색어 입력">
        <p className="placeholder">예: 결혼 안 하나, 결혼</p>
        <button className="input-button">입력</button>
      </section>

      <section className="chips" aria-label="검색 조건">
        <button className="chip chip-left">
          <span className="icon-briefcase" aria-hidden="true" />
          <span>살쪘네</span>
          <span className="chevron" aria-hidden="true" />
        </button>
        <button className="chip chip-right">
          <span className="icon-user" aria-hidden="true" />
          <span>직장/상사</span>
          <span className="chevron" aria-hidden="true" />
        </button>
      </section>

      <div className="result-label">
        <span aria-hidden="true">✧</span>
        <span>검색 결과는...</span>
      </div>

      <section className="quote-card">
        <span className="quote-open" aria-hidden="true">“</span>
        <span className="quote-close" aria-hidden="true">”</span>
        <div className="badge suggest">✧ 추천 멘트</div>
        <p className="quote-main">그 말은 조금 불편하게 들려요.</p>
        <p className="quote-sub">내 감정을 조종하면서 선을 지키는 한 문장</p>
      </section>

      <section className="principle">
        <div className="badge rule">♧ 원칙</div>
        <h2>바로 변명하지 않기</h2>
        <p>멘트보다 원칙이 중요해요.</p>
        <p>경계를 먼저 지키고, 설명은 나중에 해도 돼요.</p>
      </section>

      <div className="actions">
        <button className="main-action copy"><span aria-hidden="true">▣</span>복사하기</button>
        <button className="main-action retry"><span aria-hidden="true">↻</span>다시 추천</button>
      </div>
    </main>
  );
}
