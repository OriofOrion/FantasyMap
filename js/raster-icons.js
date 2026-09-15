// Additional point-of-interest icons backed by the hand-drawn brush stamps
// (see brush-stamps.js) rather than procedural vector paths. Merged into the
// same ICON_DEFS/ICON_KEYS registry icons.js built, so the rest of the app
// (swatch palette, hit testing, rendering) doesn't need to know the difference.

Object.assign(ICON_DEFS, {
  island: { label: 'Island', defaultSize: 140, draw(ctx, s) { drawStamp(ctx, 'island', s, INK); } },
  shield: { label: 'Shield / Heraldry', draw(ctx, s) { drawStamp(ctx, 'shield', s, INK); } },
  domed_temple: { label: 'Temple (Dome)', draw(ctx, s) { drawStamp(ctx, 'temple_dome', s, INK); } },
  pin: { label: 'Map Pin', draw(ctx, s) { drawStamp(ctx, 'pin', s, '#8a3b3b'); } },
  flagged_castle: { label: 'Castle (Flag)', draw(ctx, s) { drawStamp(ctx, 'castle_flag', s, INK); } },
});

ICON_KEYS.push('island', 'shield', 'domed_temple', 'pin', 'flagged_castle');
