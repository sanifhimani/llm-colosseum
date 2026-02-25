import { ROSTER } from '../state/roster';

const AGENT_NAMES = Object.fromEntries(ROSTER.map((r) => [r.id, r.name]));

function name(id) {
  return AGENT_NAMES[id] || id.toUpperCase();
}

export function formatEvent(event) {
  switch (event.type) {
    case 'move':
      return { msg: `${name(event.agent)} moved ${event.direction}`, color: 'var(--color-dim)' };
    case 'attack':
      return { msg: `${name(event.agent)} attacked ${name(event.target)} for ${event.damage} dmg`, color: 'var(--color-white)' };
    case 'kill':
      return { msg: `${name(event.agent)} eliminated ${name(event.target)} (${event.damage} dmg)`, color: 'var(--color-red)' };
    case 'alliance':
      return { msg: `${name(event.agent)} and ${name(event.target)} formed an alliance`, color: 'var(--color-green)' };
    case 'ally_propose':
      return { msg: `${name(event.agent)} proposed alliance to ${name(event.target)}`, color: 'var(--color-dim)' };
    case 'betray':
      return { msg: `${name(event.agent)} BETRAYED ${name(event.target)} for ${event.damage} dmg`, color: 'var(--color-red)' };
    case 'betray_kill':
      return { msg: `${name(event.agent)} BETRAYED and eliminated ${name(event.target)} (${event.damage} dmg)`, color: 'var(--color-red)' };
    case 'artifact':
      return { msg: `${name(event.agent)} picked up ${event.artifact}`, color: 'var(--color-gold)' };
    case 'stunned':
      return { msg: `${name(event.agent)} is STUNNED (API error)`, color: 'var(--color-dim)' };
    case 'zone_damage':
      return { msg: `${name(event.agent)} took ${event.damage} zone damage`, color: '#c04040' };
    case 'zone_kill':
      return { msg: `${name(event.agent)} was eliminated by the zone`, color: 'var(--color-red)' };
    case 'victory':
      return { msg: `${name(event.agent)} WINS THE BATTLE`, color: 'var(--color-gold)' };
    default:
      return { msg: `Turn ${event.turn}`, color: 'var(--color-dim)' };
  }
}
