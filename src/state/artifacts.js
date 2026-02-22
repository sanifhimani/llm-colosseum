export const ARTIFACT_TYPES = {
  weapon: { type: 'weapon', icon: '\u2694', name: 'BLADE' },
  shield: { type: 'shield', icon: '\u25C6', name: 'WARD' },
  potion: { type: 'potion', icon: '\u2726', name: 'ELIXIR' },
};

const SPAWNS = [
  { pos: [3, 8], type: 'weapon' },
  { pos: [8, 3], type: 'shield' },
  { pos: [5, 5], type: 'potion' },
];

export function createArtifacts() {
  return SPAWNS.map((spawn) => ({
    id: `artifact-${spawn.type}`,
    ...ARTIFACT_TYPES[spawn.type],
    pos: spawn.pos,
    active: true,
  }));
}
