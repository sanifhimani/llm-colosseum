function getDayNumber() {
  const now = new Date();
  const start = new Date(2026, 1, 22);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.floor((today - start) / 86400000) + 1);
}

export default function TitleBar({ battleActive = false }) {
  const day = getDayNumber();

  return (
    <div className="pbox pbox-gold titlebar">
      <div className="title-logo">{'\u2694'} LLM COLOSSEUM {'\u2694'}</div>
      {battleActive && <span className="live-pill">{'\u25CF'} LIVE</span>}
      <span className="season-tag">SEASON 1 // DAY {day}</span>
    </div>
  );
}
