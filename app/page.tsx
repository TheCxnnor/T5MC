"use client";

import { useMemo, useState } from "react";

export default function Home() {
  const [tier, setTier] = useState("T5 P1");
  const [baseFortune, setBaseFortune] = useState(8291911);
  const [afkTime, setAfkTime] = useState(1);
  const [magmaPrice, setMagmaPrice] = useState(200);

  const magmaValues = {
    lunarFragment: 1,
    chisiliteShard: 5,
    basaltShard: 10,
    breccaPowder: 15,
    amberFragment: 20,
    ametrine: 25,
    martianDust: 30,
    regolithSoil: 0,
    rhodnite: 35,
    sunFragment: 30,
    fiber: 40,
    plasmaShard: 50,
  };

  const basalt = useMemo(() => {
    const lunar = 5 * afkTime;
    const basaltShard = 2 * afkTime;
    const chisilite = 2 * afkTime;

    const magma =
      lunar * magmaValues.lunarFragment +
      basaltShard * magmaValues.basaltShard +
      chisilite * magmaValues.chisiliteShard;

    const magmaSellValueT =
      (magma * magmaPrice) / 1000;

    return {
      lunar,
      basaltShard,
      chisilite,
      magma,
      magmaSellValueT,
    };
  }, [afkTime, magmaPrice]);

  const brecca = useMemo(() => {
    const lunar = 10 * afkTime;
    const chisilite = 5 * afkTime;
    const breccaPowder = 2 * afkTime;

    const magma =
      lunar * magmaValues.lunarFragment +
      chisilite * magmaValues.chisiliteShard +
      breccaPowder * magmaValues.breccaPowder;

    const magmaSellValueT =
      (magma * magmaPrice) / 1000;

    return {
      lunar,
      chisilite,
      breccaPowder,
      magma,
      magmaSellValueT,
    };
  }, [afkTime, magmaPrice]);

  return (
    <main className="min-h-screen bg-[#1f2328] p-8 text-[#e7eaee]">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-white">
          T5 Tracker
        </h1>

        <p className="mt-2 text-[#aab2bd]">
          Progression, profit and upgrade tracking
        </p>

        <section className="mt-8 rounded-xl border border-[#4b535c] bg-[#2a3037] p-6">
          <h2 className="text-2xl font-semibold text-white">
            Profit Calculator
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-[#c7cdd4]">
                Tier
              </label>

              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="mt-1 w-full rounded border border-[#59616a] bg-[#20252b] p-2 text-white"
              >
                <option>T5 P1</option>
                <option>T5 P2</option>
                <option>T5 P3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#c7cdd4]">
                Base Fortune
              </label>

              <input
                type="number"
                value={baseFortune}
                onChange={(e) =>
                  setBaseFortune(Number(e.target.value))
                }
                className="mt-1 w-full rounded border border-[#59616a] bg-[#20252b] p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#c7cdd4]">
                AFK Time
              </label>

              <input
                type="number"
                min={1}
                value={afkTime}
                onChange={(e) =>
                  setAfkTime(Number(e.target.value))
                }
                className="mt-1 w-full rounded border border-[#59616a] bg-[#20252b] p-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#c7cdd4]">
                Magma Price (B)
              </label>

              <input
                type="number"
                value={magmaPrice}
                onChange={(e) =>
                  setMagmaPrice(Number(e.target.value))
                }
                className="mt-1 w-full rounded border border-[#59616a] bg-[#20252b] p-2 text-white"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#596f88] bg-[#34485e] p-6">
            <h3 className="text-xl font-semibold text-[#d8e7f6]">
              Basalt
            </h3>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                Lunar
                <div className="text-lg font-bold">
                  {basalt.lunar}
                </div>
              </div>

              <div>
                Basalt
                <div className="text-lg font-bold">
                  {basalt.basaltShard}
                </div>
              </div>

              <div>
                Chisilite
                <div className="text-lg font-bold">
                  {basalt.chisilite}
                </div>
              </div>
            </div>

            <p className="mt-4 text-lg">
              Magma:{" "}
              <strong>{basalt.magma}</strong>
            </p>

            <p className="mt-1 text-lg">
              Magma Value:{" "}
              <strong>
                {basalt.magmaSellValueT}T
              </strong>
            </p>
          </div>

          <div className="rounded-xl border border-[#777b80] bg-[#44484d] p-6">
            <h3 className="text-xl font-semibold">
              Brecca Crystal
            </h3>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                Lunar
                <div className="text-lg font-bold">
                  {brecca.lunar}
                </div>
              </div>

              <div>
                Chisilite
                <div className="text-lg font-bold">
                  {brecca.chisilite}
                </div>
              </div>

              <div>
                Brecca
                <div className="text-lg font-bold">
                  {brecca.breccaPowder}
                </div>
              </div>
            </div>

            <p className="mt-4 text-lg">
              Magma:{" "}
              <strong>{brecca.magma}</strong>
            </p>

            <p className="mt-1 text-lg">
              Magma Value:{" "}
              <strong>
                {brecca.magmaSellValueT}T
              </strong>
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-[#4b535c] bg-[#2a3037] p-6">
          <h2 className="text-xl font-semibold">
            Debug / Current Inputs
          </h2>

          <p className="mt-3">
            Tier: {tier}
          </p>

          <p>
            Fortune: {baseFortune.toLocaleString()}
          </p>

          <p>
            AFK Time: {afkTime}{" "}
            {afkTime === 1 ? "Hr" : "Hrs"}
          </p>

          <p>
            Magma Price: {magmaPrice}B
          </p>
        </section>
      </div>
    </main>
  );
}