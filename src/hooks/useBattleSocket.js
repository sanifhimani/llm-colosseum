import { useRef, useCallback, useEffect } from 'react';
import { ROSTER } from '../state/roster';
import { ARTIFACT_TYPES } from '../state/artifacts';
import { extractBattleStats } from '../utils/battleStats';

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

function truncateEvents(events) {
  return events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
}

export default function useBattleSocket({ update }, wsUrl) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
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
        events: truncateEvents([...prev.events, ...mapped]),
      };
    });
  }, [update]);

  const handleMessage = useCallback((data) => {
    if (data.type === 'status') {
      statusRef.current = data.status;
      return;
    }

    if (data.type === 'state') {
      statusRef.current = 'live';
      const mapped = mapStateSnapshot(data.state);
      update((prev) => ({ ...prev, ...mapped }));
      return;
    }

    if (data.type === 'battle_start') {
      statusRef.current = 'live';
      const mapped = mapStateSnapshot(data.state);
      update((prev) => ({ ...prev, ...mapped, events: [], eventSeq: 0, victory: null, thinkingAgent: null }));
      return;
    }

    if (data.type === 'thinking') {
      update({ thinkingAgent: data.agent });
      return;
    }

    if (data.type === 'turn') {
      statusRef.current = 'live';
      const mapped = mapStateSnapshot(data.state);
      update((prev) => {
        const next = { ...prev, ...mapped, thinkingAgent: null };
        if (data.event) {
          const seq = next.eventSeq + 1;
          next.eventSeq = seq;
          next.events = truncateEvents([...next.events, { id: seq, ...data.event, turn: data.turn }]);
        }
        return next;
      });
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
      update((prev) => {
        const next = { ...prev };
        if (data.state) {
          Object.assign(next, mapStateSnapshot(data.state));
        }
        if (data.winner) {
          const seq = next.eventSeq + 1;
          const victoryEvent = { id: seq, type: 'victory', agent: data.winner.id, turn: data.turns };
          next.eventSeq = seq;
          next.events = truncateEvents([...next.events, victoryEvent]);
          next.victory = extractBattleStats(next.events);
        }
        return next;
      });
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
