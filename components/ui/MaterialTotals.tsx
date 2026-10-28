import type { ReactNode } from "react";
import {
  formatCompactionTime,
  formatTotalMaterialValue,
  getTotalMaterialLabel,
  type MaterialGroupId,
  type MaterialSummary,
} from "../../lib/materialTotals";
import type { MaterialRequirement } from "../../lib/materials";

const GROUP_STYLES: Record<MaterialGroupId, string> = {
  moon: "border-[#8ea9d6]/25 bg-[#233047]/20 text-[#b6cbed]",
  mars: "border-[#d69868]/25 bg-[#452d20]/20 text-[#e5b38b]",
  sun: "border-[#d5bd62]/25 bg-[#443d20]/20 text-[#ebd88e]",
  currencies: "border-[#74c3ba]/25 bg-[#203631]/20 text-[#a4ded7]",
  misc: "border-[#8ca87f]/25 bg-[#30432d]/20 text-[#b9dfaf]",
};

function MaterialPanel({
  title,
  items,
  description,
  className = "border-white/10 bg-black/10 text-white/80",
}: {
  title: string;
  items: MaterialRequirement[];
  description?: string;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-xl border p-4 ${className}`}>
      <h4 className="text-sm font-bold">{title}</h4>
      {description && <p className="mt-1 text-xs leading-5 text-white/40">{description}</p>}
      <table className="mt-3 w-full text-sm">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/35">
            <th scope="col" className="pb-2 pr-3 text-left font-semibold">Item</th>
            <th scope="col" className="pb-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map(item => (
            <tr key={item.material}>
              <th scope="row" className="break-words py-2 pr-3 text-left font-normal text-white/65">
                {getTotalMaterialLabel(item.material)}
              </th>
              <td className="py-2 text-right align-top font-semibold tabular-nums text-white">
                {formatTotalMaterialValue(item.material, item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function MaterialTotals({
  summary,
  title = "Remaining Materials",
  showCompactionTimeBadge = false,
  description,
  emptyMessage = "All upgrades are completed. You have no remaining materials on this page.",
}: {
  summary: MaterialSummary;
  title?: string;
  showCompactionTimeBadge?: boolean;
  description: string;
  emptyMessage?: ReactNode;
}) {
  const hasRequirements = summary.rawMaterials.length > 0 || summary.cores.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-black/10 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl">
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-white/40">{description}</p>
            {hasRequirements && (
              <p className="mt-1 text-xs leading-5 text-white/35">
                Includes direct costs and all ingredients needed for compacted items, plasma items and cores.
              </p>
            )}
          </div>
          {showCompactionTimeBadge && summary.compaction.length > 0 && (
            <div className="rounded-xl border border-[#8ca87f]/20 bg-black/10 px-4 py-3 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Total Compaction Time
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[#b9dfaf]">
                {formatCompactionTime(summary.totalCompactionHours)}
              </p>
            </div>
          )}
        </div>

        {hasRequirements ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summary.groups.map(group => (
              <MaterialPanel key={group.id} title={group.title} items={group.items} className={GROUP_STYLES[group.id]} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-white/10 bg-black/10 p-5 text-center text-sm text-[#b9dfaf]">
            {emptyMessage}
          </p>
        )}
      </div>

      {(summary.compacted.length > 0 || summary.plasma.length > 0 || summary.cores.length > 0) && (
        <div>
          <p className="mb-3 text-xs leading-5 text-white/40">
            Crafting lists show what to make. Their ingredients are already included in the material totals above.
          </p>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {summary.compacted.length > 0 && (
              <MaterialPanel title="Compacted Materials" items={summary.compacted}
                description="Items required in their compacted form."
                className="border-[#bc9268]/25 bg-[#433125]/20 text-[#dfbd99]" />
            )}
            {summary.plasma.length > 0 && (
              <MaterialPanel title="Plasma Materials" items={summary.plasma}
                description="Each plasma item uses one matching compacted item."
                className="border-[#cb7c92]/25 bg-[#452532]/20 text-[#e8a7ba]" />
            )}
            {summary.cores.length > 0 && (
              <MaterialPanel title="Cores to Craft" items={summary.cores}
                description="Includes lower-star cores consumed when crafting higher-star cores."
                className="border-[#a38acb]/25 bg-[#352845]/20 text-[#cbb5e9]" />
            )}
          </div>
        </div>
      )}

      {summary.compaction.length > 0 && (
        <section className="min-w-0 rounded-2xl border border-[#bc9268]/25 bg-black/10 p-4 md:p-5">
          <h4 className="text-sm font-bold text-[#dfbd99]">Compaction Time</h4>
          <p className="mt-1 text-xs leading-5 text-white/40">
            Includes compaction for items that will be converted into plasma at a 1:1 ratio.
          </p>
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">Compaction time by item</caption>
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/35">
                <th scope="col" className="pb-2 pr-3 text-left font-semibold">Item</th>
                <th scope="col" className="pb-2 pr-3 text-right font-semibold">Quantity</th>
                <th scope="col" className="pb-2 text-right font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {summary.compaction.map(item => (
                <tr key={item.material}>
                  <th scope="row" className="break-words py-2 pr-3 text-left font-normal text-white/65">
                    {getTotalMaterialLabel(item.material)}
                  </th>
                  <td className="py-2 pr-3 text-right align-top tabular-nums">{item.amount}</td>
                  <td className="py-2 text-right align-top font-semibold tabular-nums">
                    {formatCompactionTime(item.timeHours)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 text-[#dfbd99]">
                <th scope="row" colSpan={2} className="pt-3 text-left font-semibold">Total Compaction Time</th>
                <td className="pt-3 text-right font-bold tabular-nums">{formatCompactionTime(summary.totalCompactionHours)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      )}
    </div>
  );
}
