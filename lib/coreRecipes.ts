import type { CoreCost } from "../data/coreProgression";

export type CoreRecipe = {
    name: string;
    ingredients: CoreCost[];
};

const coreRecipes: Record<string, CoreRecipe> = {
    "1★ Research Core": {
        name: "1★ Research Core",
        ingredients: [
            { name: "Lunar Fragment", amount: 16 },
            { name: "Chisilite Shard", amount: 8 },
            { name: "Magma", amount: 500 },
        ],
    },
    "2★ Research Core": {
        name: "2★ Research Core",
        ingredients: [
            { name: "1★ Research Core", amount: 1 },
            { name: "Amber Fragment", amount: 16 },
            { name: "Martian Dust", amount: 8 },
            { name: "Magma", amount: 1000 },
        ],
    },
    "3★ Research Core": {
        name: "3★ Research Core",
        ingredients: [
            { name: "2★ Research Core", amount: 1 },
            { name: "Sun Fragment", amount: 16 },
            { name: "Plasma Shard", amount: 8 },
            { name: "Magma", amount: 2000 },
        ],
    },
    "Power Core 1★": {
        name: "Power Core 1★",
        ingredients: [
            { name: "Lunar Fragment", amount: 8 },
            { name: "Chisilite Shard", amount: 4 },
            { name: "Magma", amount: 250 },
        ],
    },
    "Power Core 2★": {
        name: "Power Core 2★",
        ingredients: [
            { name: "Power Core 1★", amount: 1 },
            { name: "Amber Fragment", amount: 8 },
            { name: "Martian Dust", amount: 4 },
            { name: "Magma", amount: 500 },
        ],
    },
    "1★ Beacon Core": {
        name: "1★ Beacon Core",
        ingredients: [
            { name: "Lunar Fragment", amount: 8 },
            { name: "Chisilite Shard", amount: 4 },
            { name: "Magma", amount: 250 },
        ],
    },
    "2★ Beacon Core": {
        name: "2★ Beacon Core",
        ingredients: [
            { name: "1★ Beacon Core", amount: 1 },
            { name: "Amber Fragment", amount: 8 },
            { name: "Martian Dust", amount: 4 },
            { name: "Magma", amount: 500 },
        ],
    },
    "3★ Beacon Core": {
        name: "3★ Beacon Core",
        ingredients: [
            { name: "2★ Beacon Core", amount: 1 },
            { name: "Sun Fragment", amount: 8 },
            { name: "Plasma Shard", amount: 4 },
            { name: "Magma", amount: 1000 },
        ],
    },
    "Molten Core": {
        name: "Molten Core",
        ingredients: [
            { name: "Chisilite Shard", amount: 8 },
            { name: "Amber Fragment", amount: 4 },
            { name: "Magma", amount: 500 },
        ],
    },
};

export function canonicalCoreName(name: string) {
    const aliases: Record<string, string> = {
        "Research Core 1★": "1★ Research Core",
        "Research Core 2★": "2★ Research Core",
        "Research Core 3★": "3★ Research Core",
        "Beacon Core 1★": "1★ Beacon Core",
        "Beacon Core 2★": "2★ Beacon Core",
        "Beacon Core 3★": "3★ Beacon Core",
    };
    return aliases[name] ?? name;
}

export function getCoreRecipe(name: string) {
    return coreRecipes[canonicalCoreName(name)];
}

export function combineCosts(costs: CoreCost[]) {
    const totals: Record<string, number> = {};
    for (const cost of costs) {
        totals[cost.name] =
            (totals[cost.name] ?? 0) +
                cost.amount;
    }
    return Object.entries(totals).map(([name, amount]) => ({
        name,
        amount,
    }));
}

export function getRecursiveCoreDependencies(coreName: string, quantity: number, result: Record<string, number> = {}) {
    const recipe = getCoreRecipe(coreName);
    if (!recipe) {
        return result;
    }
    for (const ingredient of recipe.ingredients) {
        const ingredientRecipe = getCoreRecipe(ingredient.name);
        if (!ingredientRecipe) {
            continue;
        }
        const canonical = canonicalCoreName(ingredient.name);
        const amount = ingredient.amount *
            quantity;
        result[canonical] =
            (result[canonical] ?? 0) +
                amount;
        getRecursiveCoreDependencies(canonical, amount, result);
    }
    return result;
}

export function getRecursiveRawMaterials(coreName: string, quantity: number, result: Record<string, number> = {}) {
    const recipe = getCoreRecipe(coreName);
    if (!recipe) {
        return result;
    }
    for (const ingredient of recipe.ingredients) {
        const amount = ingredient.amount *
            quantity;
        if (getCoreRecipe(ingredient.name)) {
            getRecursiveRawMaterials(ingredient.name, amount, result);
        }
        else {
            result[ingredient.name] =
                (result[ingredient.name] ?? 0) +
                    amount;
        }
    }
    return result;
}

export function prepareDisplayCosts(costs: CoreCost[]): CoreCost[] {
    if (costs.length === 0) {
        return [];
    }
    const combined = combineCosts(costs);
    const coreAmounts: Record<string, number> = {};
    for (const cost of combined) {
        if (!getCoreRecipe(cost.name)) {
            continue;
        }
        const canonical = canonicalCoreName(cost.name);
        coreAmounts[canonical] =
            (coreAmounts[canonical] ?? 0) +
                cost.amount;
    }
    const coreNames = Object.keys(coreAmounts);
    const dependentCoreNames = new Set<string>();
    for (const name of coreNames) {
        const dependencies = getRecursiveCoreDependencies(name, 1);
        for (const dependencyName of Object.keys(dependencies)) {
            if (coreAmounts[dependencyName] !== undefined) {
                dependentCoreNames.add(dependencyName);
            }
        }
    }
    const visibleCoreAmounts = {
        ...coreAmounts,
    };
    const rootCoreNames = coreNames.filter((name) => !dependentCoreNames.has(name));
    for (const rootName of rootCoreNames) {
        const rootQuantity = coreAmounts[rootName];
        const dependencies = getRecursiveCoreDependencies(rootName, rootQuantity);
        for (const [dependencyName, dependencyAmount,] of Object.entries(dependencies)) {
            if (visibleCoreAmounts[dependencyName] === undefined) {
                continue;
            }
            visibleCoreAmounts[dependencyName] = Math.max(0, visibleCoreAmounts[dependencyName] -
                dependencyAmount);
        }
    }
    const representedRawMaterials: Record<string, number> = {};
    for (const [coreName, quantity,] of Object.entries(visibleCoreAmounts)) {
        if (quantity <= 0) {
            continue;
        }
        getRecursiveRawMaterials(coreName, quantity, representedRawMaterials);
    }
    const rawRemaining = {
        ...representedRawMaterials,
    };
    const coreOutput: CoreCost[] = [];
    const addedCores = new Set<string>();
    for (const cost of combined) {
        if (!getCoreRecipe(cost.name)) {
            continue;
        }
        const canonical = canonicalCoreName(cost.name);
        if (addedCores.has(canonical)) {
            continue;
        }
        addedCores.add(canonical);
        const amount = visibleCoreAmounts[canonical] ?? 0;
        if (amount <= 0) {
            continue;
        }
        coreOutput.push({
            name: canonical,
            amount,
        });
    }
    const materialOutput: CoreCost[] = [];
    for (const cost of combined) {
        if (getCoreRecipe(cost.name)) {
            continue;
        }
        const represented = rawRemaining[cost.name] ?? 0;
        if (represented <= 0) {
            materialOutput.push(cost);
            continue;
        }
        const amountUsed = Math.min(represented, cost.amount);
        const leftover = cost.amount -
            amountUsed;
        rawRemaining[cost.name] =
            represented -
                amountUsed;
        if (leftover > 0) {
            materialOutput.push({
                name: cost.name,
                amount: leftover,
            });
        }
    }
    return [
        ...coreOutput,
        ...materialOutput,
    ];
}
