// Icon upgrades and additions from the Janssonius 17th-century brush pack
// (see janssonius-stamps.js). Overrides a few existing vector icons with
// period-engraved equivalents and adds some new ones.

ICON_DEFS.town.draw = function (ctx, s) { drawStamp(ctx, 'jans_town', s, INK); };
ICON_DEFS.city.draw = function (ctx, s) { drawStamp(ctx, 'jans_city', s, INK); };
ICON_DEFS.camp.draw = function (ctx, s) { drawStamp(ctx, 'jans_camp', s, INK); };

Object.assign(ICON_DEFS, {
  ship: { label: 'Ship', defaultSize: 60, draw(ctx, s) { drawStamp(ctx, 'jans_ship', s, INK); } },
  shipwreck: { label: 'Shipwreck', draw(ctx, s) { drawStamp(ctx, 'jans_shipwreck', s, INK); } },
  oasis: { label: 'Oasis / Palms', defaultSize: 70, draw(ctx, s) { drawStamp(ctx, 'jans_oasis', s, '#4a6b3a'); } },
  reef: { label: 'Reef / Hazard', draw(ctx, s) { drawStamp(ctx, 'jans_hazard', s, '#8a3b3b'); } },
  wind_cherub: { label: 'Wind Cherub', defaultSize: 60, draw(ctx, s) { drawStamp(ctx, 'jans_wind_cherub', s, INK); } },
});

ICON_KEYS.push('ship', 'shipwreck', 'oasis', 'reef', 'wind_cherub');
