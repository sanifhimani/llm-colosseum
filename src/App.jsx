import TitleBar from './components/TitleBar';

function App() {
  return (
    <div className="screen">
      <TitleBar />

      <div className="main-area">
        <div className="pbox" style={{ overflow: 'hidden' }}>
          <div className="panel-title">{'\u25B6'} FIGHTERS</div>
        </div>

        <div className="arena-wrap pbox" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="arena-canvas-el" style={{ background: '#1a1a2a' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="pbox" style={{ overflow: 'hidden' }}>
            <div className="panel-title">{'\u25B6'} BATTLE LOG</div>
          </div>
          <div className="pbox" style={{ overflow: 'hidden' }}>
            <div className="panel-title">{'\u25B6'} GRUDGE MAP</div>
          </div>
          <div className="pbox" style={{ overflow: 'hidden' }}>
            <div className="panel-title">{'\u25B6'} ZONE / HAZARDS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
