export default function TitleBar({ mode = 'demo' }) {
  const isLive = mode === 'live';

  return (
    <div className="pbox pbox-gold titlebar">
      <div className="title-logo">{'\u2694'} LLM COLOSSEUM {'\u2694'}</div>
      <div className="title-info">
        <span className="season-tag">SEASON 1</span>
        <span className={isLive ? 'live-pill' : 'demo-pill'}>
          {'\u25CF'} {isLive ? 'LIVE' : 'DEMO'}
        </span>
      </div>
    </div>
  );
}
