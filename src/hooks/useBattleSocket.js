import { useRef, useCallback, useEffect } from 'react';
import { ROSTER } from '../state/roster';
import { ARTIFACT_TYPES } from '../state/artifacts';

const MAX_EVENTS = 500;
const RECONNECT_MS = 3000;

const ROSTER_LOOKUP = Object.fromEntries(ROSTER.map((r) => [r.id, r]));
const ICON_LOOKUP = Object.fromEntries(
  Object.values(ARTIFACT_TYPES).map((a) => [a.type, a.icon]),
);

function mapAgents(engineAgents) {
  return engineAgents.map((a) => ({
    ...a,
    color: ROSTER_LOOKUP[a.id]?.color || '#888',
    model: ROSTER_LOOKUP[a.id]?.model || null,
    pendingAlly: null,
    weaponBuff: false,
    shieldHp: 0,
  }));
}

function mapArtifacts(engineArtifacts) {
  return engineArtifacts.map((a) => ({
    ...a,
    icon: ICON_LOOKUP[a.type] || '?',
  }));
}

function mapStateSnapshot(snapshot) {
  return {
    agents: mapAgents(snapshot.agents),
    artifacts: mapArtifacts(snapshot.artifacts),
    zoneRadius: snapshot.zoneRadius,
    turn: snapshot.turn,
    grudges: snapshot.grudges,
  };
}

export default function useBattleSocket({ update }, wsUrl, { autoTrigger = false } = {}) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const triggeredRef = useRef(false);
  const statusRef = useRef('disconnected');
  const urlRef = useRef(wsUrl);
  urlRef.current = wsUrl;

  const pushEvents = useCallback((newEvents) => {
    update((prev) => {
      let seq = prev.eventSeq;
      const mapped = newEvents.map((e) => {
        seq++;
        return { id: seq, ...e };
      });
      return {
        ...prev,
        eventSeq: seq,
        events: [...prev.events.slice(-MAX_EVENTS), ...mapped],
      };
    });
  }, [update]);

  const handleMessage = useCallback((data) => {
    if (data.type === 'status' && data.status === 'idle') {
      statusRef.current = 'idle';
      if (autoTrigger && !triggeredRef.current) {
        triggeredRef.current = true;
        fetch('/api/trigger', { method: 'POST' }).catch(() => {});
      }
      return;
    }

    if (data.type === 'state' || data.type === 'battle_start') {
      statusRef.current = 'live';
      const mapped = mapStateSnapshot(data.state);
      update((prev) => ({ ...prev, ...mapped }));
      return;
    }

    if (data.type === 'turn') {
      statusRef.current = 'live';
      const mapped = mapStateSnapshot(data.state);
      update((prev) => ({ ...prev, ...mapped }));

      if (data.event) {
        pushEvents([{ ...data.event, turn: data.turn }]);
      }
      return;
    }

    if (data.type === 'zone_shrink') {
      update({ zoneRadius: data.radius });
      return;
    }

    if (data.type === 'zone_damage' || data.type === 'zone_kill') {
      pushEvents([{ type: data.type, agent: data.agent, damage: data.damage, turn: data.turn }]);
      return;
    }

    if (data.type === 'battle_end') {
      statusRef.current = 'idle';
      if (data.state) {
        const mapped = mapStateSnapshot(data.state);
        update((prev) => ({ ...prev, ...mapped }));
      }
      if (data.winner) {
        pushEvents([{ type: 'victory', agent: data.winner.id, turn: data.turns }]);
      }
      return;
    }
  }, [update, pushEvents]);

  const connect = useCallback(() => {
    if (!urlRef.current || wsRef.current) return;

    const ws = new WebSocket(urlRef.current);
    wsRef.current = ws;
    statusRef.current = 'connecting';

    ws.onopen = () => {
      statusRef.current = 'connected';
    };

    ws.onmessage = (e) => {
      try {
        handleMessage(JSON.parse(e.data));
      } catch {
        // malformed message
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      statusRef.current = 'disconnected';
      if (urlRef.current) {
        reconnectRef.current = setTimeout(connect, RECONNECT_MS);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [handleMessage]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectRef.current);
    reconnectRef.current = null;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    statusRef.current = 'disconnected';
  }, []);

  useEffect(() => {
    if (!wsUrl) return;
    connect();
    return disconnect;
  }, [wsUrl, connect, disconnect]);

  return { disconnect, statusRef };
}
