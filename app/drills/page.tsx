import { drills } from "../../data/drills";
import { materials } from "../../data/materials";

function formatRequirement(materialKey: string, amount: number) {
  const material = materials[materialKey as keyof typeof materials];

  return `${amount.toLocaleString()} ${material?.name ?? materialKey}`;
}

export default function DrillsPage() {
  const moonDrills = drills.filter((drill) => drill.region === "moon");
  const marsDrills = drills.filter((drill) => drill.region === "mars");
  const sunDrills = drills.filter((drill) => drill.region === "sun");

  return (
    <main className="min-h-screen bg-[#1f2328] p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold">
          Drills
        </h1>

        <p className="mt-2 text-[#aab2bd]">
          Full drill progression
        </p>

        <DrillSection
          title="Moon"
          drills={moonDrills}
          className="border-[#5f7896] bg-[#2f4054]"
        />

        <DrillSection
          title="Mars"
          drills={marsDrills}
          className="border-[#9b604d] bg-[#56382f]"
        />

        <DrillSection
          title="Sun"
          drills={sunDrills}
          className="border-[#9b8146] bg-[#554923]"
        />
      </div>
    </main>
  );
}

type Drill = (typeof drills)[number];

type DrillSectionProps = {
  title: string;
  drills: Drill[];
  className: string;
};

function DrillSection({
  title,
  drills,
  className,
}: DrillSectionProps) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl font-semibold">
        {title}
      </h2>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {drills.map((drill) => (
          <div
            key={drill.id}
            className={`rounded-xl border p-5 ${className}`}
          >
            <h3 className="text-xl font-bold">
              {drill.name}
            </h3>

            {drill.prerequisite && (
              <p className="mt-1 text-sm text-[#c2c8cf]">
                Requires: {drill.prerequisite}
              </p>
            )}

            <div className="mt-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#b8c0c8]">
                Cost
              </p>

              <ul className="mt-2 space-y-1 text-sm">
                {drill.requirements.map((requirement) => (
                  <li
                    key={`${drill.id}-${requirement.material}`}
                  >
                    {formatRequirement(
                      requirement.material,
                      requirement.amount
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}