export const drills = [
  {
    id: "crater-drill",
    name: "Crater Drill",
    prerequisite: "Icehowl Drill",
    region: "moon",
    requirements: [
      { material: "lunarFragment", amount: 16 },
      { material: "chisiliteShard", amount: 8 },
      { material: "magma", amount: 100 },
    ],
  },

  {
    id: "satellite-drill",
    name: "Satellite Drill",
    prerequisite: "Crater Drill",
    region: "moon",
    requirements: [
      { material: "lunarFragment", amount: 32 },
      { material: "chisiliteShard", amount: 16 },
      { material: "magma", amount: 150 },
    ],
  },

  {
    id: "serene-drill",
    name: "Serene Drill",
    prerequisite: "Satellite Drill",
    region: "moon",
    requirements: [
      { material: "lunarFragment", amount: 64 },
      { material: "chisiliteShard", amount: 32 },
      { material: "basaltShard", amount: 16 },
      { material: "magma", amount: 250 },
    ],
  },

  {
    id: "lunar-drill",
    name: "Lunar Drill",
    prerequisite: "Serene Drill",
    region: "moon",
    requirements: [
      { material: "chisiliteShard", amount: 64 },
      { material: "basaltShard", amount: 32 },
      { material: "breccaPowder", amount: 16 },
      { material: "magma", amount: 500 },
    ],
  },

  {
    id: "dust-drill",
    name: "Dust Drill",
    prerequisite: "Lunar Drill",
    region: "mars",
    requirements: [
      { material: "basaltShard", amount: 64 },
      { material: "breccaPowder", amount: 64 },
      { material: "rhodnite", amount: 8 },
      { material: "magma", amount: 1000 },
    ],
  },

  {
    id: "cold-drill",
    name: "Cold Drill",
    prerequisite: "Dust Drill",
    region: "mars",
    requirements: [
      { material: "rhodnite", amount: 12 },
      { material: "martianDust", amount: 8 },
      { material: "magma", amount: 2000 },
    ],
  },

  {
    id: "arid-drill",
    name: "Arid Drill",
    prerequisite: "Cold Drill",
    region: "mars",
    requirements: [
      { material: "rhodnite", amount: 24 },
      { material: "martianDust", amount: 16 },
      { material: "amberFragment", amount: 8 },
      { material: "magma", amount: 3000 },
    ],
  },

  {
    id: "planetary-drill",
    name: "Planetary Drill",
    prerequisite: "Arid Drill",
    region: "mars",
    requirements: [
      { material: "rhodnite", amount: 32 },
      { material: "martianDust", amount: 32 },
      { material: "amberFragment", amount: 16 },
      { material: "ametrine", amount: 8 },
      { material: "magma", amount: 4000 },
    ],
  },

  {
    id: "martian-drill",
    name: "Martian Drill",
    prerequisite: "Planetary Drill",
    region: "mars",
    requirements: [
      { material: "rhodnite", amount: 64 },
      { material: "martianDust", amount: 64 },
      { material: "amberFragment", amount: 48 },
      { material: "ametrine", amount: 32 },
      { material: "magma", amount: 5000 },
    ],
  },

  {
    id: "star-drill",
    name: "Star Drill",
    prerequisite: "Martian Drill",
    region: "sun",
    requirements: [
      { material: "sunFragment", amount: 16 },
      { material: "compactedLunarAlloy", amount: 2 },
      { material: "compactedMartianAlloy", amount: 2 },
      { material: "magma", amount: 5000 },
    ],
  },

  {
    id: "solar-drill",
    name: "Solar Drill",
    prerequisite: "Star Drill",
    region: "sun",
    requirements: [
      { material: "sunFragment", amount: 32 },
      { material: "plasmaShard", amount: 8 },
      { material: "compactedLunarAlloy", amount: 3 },
      { material: "compactedMartianAlloy", amount: 3 },
      { material: "plasmaCompactedLunarAlloy", amount: 1 },
      { material: "plasmaCompactedMartianAlloy", amount: 1 },
      { material: "magma", amount: 6250 },
    ],
  },

  {
    id: "corona-drill",
    name: "Corona Drill",
    prerequisite: "Solar Drill",
    region: "sun",
    requirements: [
      { material: "sunFragment", amount: 64 },
      { material: "plasmaShard", amount: 24 },
      { material: "compactedMartianAlloy", amount: 6 },
      { material: "compactedSolarAlloy", amount: 6 },
      { material: "plasmaCompactedMartianAlloy", amount: 2 },
      { material: "plasmaCompactedSolarAlloy", amount: 2 },
      { material: "coronaSurgeFlare", amount: 4 },
      { material: "magma", amount: 7500 },
    ],
  },

  {
    id: "nova-drill",
    name: "Nova Drill",
    prerequisite: "Corona Drill",
    region: "sun",
    requirements: [
      { material: "sunFragment", amount: 64 },
      { material: "plasmaShard", amount: 48 },
      { material: "fiber", amount: 32 },
      { material: "compactedMartianAlloy", amount: 12 },
      { material: "compactedSolarAlloy", amount: 12 },
      { material: "plasmaCompactedMartianAlloy", amount: 4 },
      { material: "plasmaCompactedSolarAlloy", amount: 4 },
      { material: "stellarPulseFlare", amount: 16 },
      { material: "compactedMagma", amount: 1 },
      { material: "magma", amount: 3750 },
    ],
  },

  {
    id: "fusion-drill",
    name: "Fusion Drill",
    prerequisite: "Nova Drill",
    region: "sun",
    requirements: [
      { material: "sunFragment", amount: 64 },
      { material: "plasmaShard", amount: 64 },
      { material: "fiber", amount: 64 },
      { material: "compactedSolarAlloy", amount: 18 },
      { material: "compactedMartianAlloy", amount: 18 },
      { material: "plasmaCompactedSolarAlloy", amount: 6 },
      { material: "plasmaCompactedMartianAlloy", amount: 6 },
      { material: "eternalSingularityFlare", amount: 16 },
      { material: "plasmaCompactedMagma", amount: 1 },
      { material: "magma", amount: 5000 },
    ],
  },
];