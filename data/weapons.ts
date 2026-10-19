export type WeaponType =
  | "pickaxe"
  | "bludgeon";

export type Weapon = {
  id: string;
  name: string;
  type: WeaponType;
  damage: number;
};

export const weapons: Weapon[] = [
  /* =========================================================
     PICKAXES
     ========================================================= */

  {
    id: "lava-pickaxe",
    name: "Lava Pickaxe",
    type: "pickaxe",
    damage: 1,
  },

  {
    id: "molten-pickaxe",
    name: "Molten Pickaxe",
    type: "pickaxe",
    damage: 2,
  },

  {
    id: "hellfire-pickaxe",
    name: "Hellfire Pickaxe",
    type: "pickaxe",
    damage: 5,
  },

  {
    id: "magma-mauler-pickaxe",
    name: "Magma Mauler Pickaxe",
    type: "pickaxe",
    damage: 10,
  },

  {
    id: "blazebreaker-pickaxe",
    name: "Blazebreaker Pickaxe",
    type: "pickaxe",
    damage: 100,
  },

  {
    id: "ashen-axe-pickaxe",
    name: "Ashen Axe Pickaxe",
    type: "pickaxe",
    damage: 500,
  },

  {
    id: "netherfang-pickaxe",
    name: "Netherfang Pickaxe",
    type: "pickaxe",
    damage: 1_000,
  },

  {
    id: "flarestrike-pickaxe",
    name: "Flarestrike Pickaxe",
    type: "pickaxe",
    damage: 2_500,
  },

  {
    id: "brimstone-blade-pickaxe",
    name: "Brimstone Blade Pickaxe",
    type: "pickaxe",
    damage: 5_000,
  },

  {
    id: "forged-lava-pickaxe",
    name: "Forged Lava Pickaxe",
    type: "pickaxe",
    damage: 10_000,
  },

  {
    id: "emberforge-pickaxe",
    name: "Emberforge Pickaxe",
    type: "pickaxe",
    damage: 20_000,
  },

  {
    id: "cinderstrike-pickaxe",
    name: "Cinderstrike Pickaxe",
    type: "pickaxe",
    damage: 50_000,
  },

  {
    id: "netherite-nightmare-pickaxe",
    name: "Netherite Nightmare Pickaxe",
    type: "pickaxe",
    damage: 100_000,
  },

  {
    id: "volcanic-bite-pickaxe",
    name: "Volcanic Bite Pickaxe",
    type: "pickaxe",
    damage: 250_000,
  },

  {
    id: "volcanic-bite-pickaxe-1-star",
    name: "Volcanic Bite Pickaxe 1★",
    type: "pickaxe",
    damage: 250_000,
  },

  {
    id: "volcanic-bite-pickaxe-2-star",
    name: "Volcanic Bite Pickaxe 2★",
    type: "pickaxe",
    damage: 260_000,
  },

  /* =========================================================
     BLUDGEONS
     ========================================================= */

  {
    id: "basic-bludgeon",
    name: "Basic Bludgeon",
    type: "bludgeon",
    damage: 285_000,
  },

  {
    id: "handy-bludgeon",
    name: "Handy Bludgeon",
    type: "bludgeon",
    damage: 320_000,
  },

  {
    id: "advanced-bludgeon",
    name: "Advanced Bludgeon",
    type: "bludgeon",
    damage: 355_000,
  },

  {
    id: "hefty-bludgeon",
    name: "Hefty Bludgeon",
    type: "bludgeon",
    damage: 390_000,
  },

  {
    id: "expert-bludgeon",
    name: "Expert Bludgeon",
    type: "bludgeon",
    damage: 425_000,
  },

  {
    id: "deadly-bludgeon",
    name: "Deadly Bludgeon",
    type: "bludgeon",
    damage: 460_000,
  },

  {
    id: "fleshripper-bludgeon",
    name: "Fleshripper Bludgeon",
    type: "bludgeon",
    damage: 500_000,
  },
];

/* =========================================================
   OPTIONAL HELPERS
   ========================================================= */

export const pickaxes =
  weapons.filter(
    (weapon) =>
      weapon.type === "pickaxe"
  );

export const bludgeons =
  weapons.filter(
    (weapon) =>
      weapon.type === "bludgeon"
  );

export function getWeapon(
  id: string
) {
  return weapons.find(
    (weapon) =>
      weapon.id === id
  );
}