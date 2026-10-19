export type MobDrop = {
  item: string;
  chanceOneIn: number;
};

export type Mob = {
  id: string;
  name: string;
  hp: number;
  ash: number;
  drops: MobDrop[];
};

export const mobs: Mob[] = [
  {
    id: "fire-slinger",
    name: "Fire Slinger",
    hp: 100,
    ash: 1,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 2500,
      },
      {
        item: "Blazebound Talisman",
        chanceOneIn: 1000,
      },
      {
        item: "Embercore Talisman",
        chanceOneIn: 10000,
      },
      {
        item: "Slinger Core",
        chanceOneIn: 5000,
      },
    ],
  },

  {
    id: "fire-mage",
    name: "Fire Mage",
    hp: 10_000,
    ash: 25,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 2500,
      },
      {
        item: "Embercore Talisman",
        chanceOneIn: 1000,
      },
      {
        item: "Talisman of Infernal Flames",
        chanceOneIn: 50000,
      },
      {
        item: "Firemage Core",
        chanceOneIn: 10000,
      },
    ],
  },

  {
    id: "zhurak",
    name: "Zhurak",
    hp: 1_000_000,
    ash: 1_500,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 1500,
      },
      {
        item: "Talisman of Infernal Flames",
        chanceOneIn: 10000,
      },
      {
        item: "Abyssflame Talisman",
        chanceOneIn: 20000,
      },
      {
        item: "Primordial Flame Talisman",
        chanceOneIn: 100000,
      },
      {
        item: "Emberborn Core",
        chanceOneIn: 50000,
      },
    ],
  },

  {
    id: "frozen-alex",
    name: "Frozen Alex",
    hp: 2_000_000,
    ash: 2_500,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 750,
      },
      {
        item: "Talisman of Frost",
        chanceOneIn: 5000,
      },
      {
        item: "Glacierheart Talisman",
        chanceOneIn: 20000,
      },
      {
        item: "Frozen Alex Core",
        chanceOneIn: 20000,
      },
    ],
  },

  {
    id: "frozen-captain",
    name: "Frozen Captain",
    hp: 5_000_000,
    ash: 7_500,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 333,
      },
      {
        item: "Glacierheart Talisman",
        chanceOneIn: 5000,
      },
      {
        item: "Cryoshade Talisman",
        chanceOneIn: 20000,
      },
      {
        item: "Captains Core",
        chanceOneIn: 25000,
      },
    ],
  },

  {
    id: "corruptonaut",
    name: "Corruptonaut",
    hp: 20_000_000,
    ash: 33_000,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 110,
      },
      {
        item: "T5 Key",
        chanceOneIn: 2000,
      },
      {
        item: "1★ Conjunction",
        chanceOneIn: 5000,
      },
      {
        item: "2★ Conjunction",
        chanceOneIn: 20000,
      },
      {
        item: "Harded Andecite Talisman",
        chanceOneIn: 10000,
      },
    ],
  },

  {
    id: "stardust-wizard",
    name: "Stardust Wizard",
    hp: 50_000_000,
    ash: 95_000,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 40,
      },
      {
        item: "T5 Key",
        chanceOneIn: 550,
      },
      {
        item: "2★ Conjunction",
        chanceOneIn: 5000,
      },
      {
        item: "3★ Conjunction",
        chanceOneIn: 20000,
      },
      {
        item: "Boiling Core Talisman",
        chanceOneIn: 10000,
      },
    ],
  },

  {
    id: "space-pirate",
    name: "Space Pirate",
    hp: 175_000_000,
    ash: 380_000,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 15,
      },
      {
        item: "T5 Key",
        chanceOneIn: 140,
      },
      {
        item: "3★ Conjunction",
        chanceOneIn: 5000,
      },
      {
        item: "4★ Conjunction",
        chanceOneIn: 20000,
      },
      {
        item: "Solar Crown Talisman",
        chanceOneIn: 10000,
      },
    ],
  },

  {
    id: "galactic-terror",
    name: "Galactic Terror",
    hp: 500_000_000,
    ash: 1_250_000,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 6,
      },
      {
        item: "T5 Key",
        chanceOneIn: 40,
      },
      {
        item: "4★ Conjunction",
        chanceOneIn: 5000,
      },
      {
        item: "5★ Conjunction",
        chanceOneIn: 20000,
      },
      {
        item: "Fungal Beacon",
        chanceOneIn: 10000,
      },
    ],
  },

  {
    id: "celestial-emperor",
    name: "Celestial Emperor",
    hp: 2_500_000_000,
    ash: 7_200_000,
    drops: [
      {
        item: "T4 Key",
        chanceOneIn: 2,
      },
      {
        item: "T5 Key",
        chanceOneIn: 12,
      },
      {
        item: "5★ Conjunction",
        chanceOneIn: 5000,
      },
      {
        item: "Cosmic Superwarp Conjunction",
        chanceOneIn: 20000,
      },
      {
        item: "Soulsucked Singularity",
        chanceOneIn: 10000,
      },
    ],
  },
];