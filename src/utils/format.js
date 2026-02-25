export function formatAction(turn) {
  const { action, event } = turn;
  if (!event) {
    if (action.type === 'MOVE') return `MOVED ${action.direction}`;
    return action.type;
  }

  const target = (event.target || action.target || '').toUpperCase();
  const dmg = event.damage ? ` FOR ${event.damage} DMG` : '';

  switch (event.type) {
    case 'kill':
      return `ATTACKED ${target}${dmg} -- ELIMINATED`;
    case 'attack':
      return `ATTACKED ${target}${dmg}`;
    case 'alliance':
      return `ALLIED WITH ${target}`;
    case 'ally_propose':
      return `PROPOSED ALLIANCE WITH ${target}`;
    case 'artifact':
      return `PICKED UP ${(event.artifact || '').toUpperCase()}`;
    case 'move':
      return `MOVED ${event.direction || action.direction}`;
    default:
      return action.type;
  }
}
