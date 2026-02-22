export default function TitleBar() {
  return (
    <div className="pbox pbox-gold titlebar">
      <div className="title-logo">{'\u2694'} LLM COLOSSEUM {'\u2694'}</div>
      <div className="title-info">
        <span className="season-tag">SEASON 1</span>
        <span className="live-pill">{'\u25CF'} LIVE</span>
        <span className="timer-big">00:00</span>
      </div>
    </div>
  );
}
