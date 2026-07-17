import { useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldTopo from "@/lib/world-110m.json";
import { fmtInt, fmtPct } from "@/lib/canon";
import { cn } from "@/lib/utils";

/* ── GeoMap — the Geography card's choropleth ───────────────────────
   A world map (vendored world-atlas 110m topojson, drawn with d3-geo's
   Natural Earth projection — no map library) where the window's data
   countries carry a sequential violet scale by share of voters. The
   country table below the map remains the accessible, exact-figures
   view; the map is the shape-of-the-audience glance. */

export type GeoMapCountry = {
  name: string;
  /** Share of the window's voters, in %. */
  share: number;
  voters?: number;
};

type GeoMapProps = {
  countries: GeoMapCountry[];
  className?: string;
};

/* Data names → the topojson's properties.name where they disagree.
   Unmatched names simply don't highlight (aggregates like "Other"
   never will — they have no landmass). */
const NAME_ALIASES: Record<string, string> = {
  "United States": "United States of America",
  UK: "United Kingdom",
  "Czech Republic": "Czechia",
};

const MAP_W = 960;
const MAP_H = 480; // ~2:1, the Natural Earth frame minus Antarctica

type CountryShape = { name: string; d: string };

/** Projected once from the static topojson — the geometry never changes. */
let shapeCache: CountryShape[] | null = null;
function worldShapes(): CountryShape[] {
  if (shapeCache) return shapeCache;
  const topo = worldTopo as unknown as Topology<{
    countries: GeometryCollection<{ name: string }>;
  }>;
  const all = feature(topo, topo.objects.countries).features.filter(
    (f) => f.properties.name !== "Antarctica",
  );
  const projection = geoNaturalEarth1().fitSize([MAP_W, MAP_H], {
    type: "FeatureCollection",
    features: all,
  });
  const path = geoPath(projection);
  shapeCache = all.map((f) => ({ name: f.properties.name, d: path(f) ?? "" }));
  return shapeCache;
}

/** Sequential violet: one hue, light→dark, intensity ∝ share of the max.
 *  Mixed into the card surface so the lightest step still reads as data
 *  against the neutral landmass. */
const violetAt = (t: number, boost = 0) =>
  `color-mix(in srgb, var(--color-brand-purple) ${Math.round(
    Math.min(100, 18 + 82 * t + boost),
  )}%, var(--surface-raised))`;

type Tip = { name: string; share: number; voters?: number; x: number; y: number };

export function GeoMap({ countries, className }: GeoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const shapes = useMemo(worldShapes, []);

  const byTopoName = useMemo(() => {
    const map = new Map<string, GeoMapCountry>();
    for (const c of countries) map.set(NAME_ALIASES[c.name] ?? c.name, c);
    return map;
  }, [countries]);

  const shares = [...byTopoName.values()].map((c) => c.share);
  const maxShare = Math.max(...shares, 1);
  const minShare = Math.min(...shares, maxShare);

  const moveTip = (row: GeoMapCountry, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTip({
      name: row.name,
      share: row.share,
      voters: row.voters,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const rect = containerRef.current?.getBoundingClientRect();
  const flipX = tip && rect ? tip.x > rect.width * 0.55 : false;
  const flipY = tip && rect ? tip.y > rect.height * 0.6 : false;

  const named = [...byTopoName.values()]
    .map((c) => `${c.name} ${fmtPct(c.share, 0)}`)
    .join(", ");

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block w-full"
        role="img"
        tabIndex={0}
        aria-label={`World map of voter share by country: ${named}. The table below lists the exact figures for every country.`}
      >
        {shapes.map((shape) => {
          const row = byTopoName.get(shape.name);
          const hovered = tip?.name === row?.name && tip !== null;
          if (!row) {
            return (
              <path
                key={shape.name}
                d={shape.d}
                fill="var(--surface-strong)"
                stroke="var(--surface-raised)"
                strokeWidth={0.5}
              />
            );
          }
          const t = maxShare > 0 ? row.share / maxShare : 0;
          return (
            <path
              key={shape.name}
              d={shape.d}
              fill={violetAt(t, hovered ? 14 : 0)}
              stroke={hovered ? "var(--color-brand-purple)" : "var(--surface-raised)"}
              strokeWidth={hovered ? 1 : 0.5}
              className="cursor-default"
              onMouseEnter={(e) => moveTip(row, e)}
              onMouseMove={(e) => moveTip(row, e)}
              onMouseLeave={() => setTip(null)}
            />
          );
        })}
      </svg>

      {/* Legend — sequential min→max share, bottom-left like a map key. */}
      <div className="pointer-events-none absolute bottom-0 left-0 flex items-center gap-2">
        <span className="text-[11px] tabular-nums text-text-tertiary">
          {fmtPct(minShare, 0)}
        </span>
        <span
          aria-hidden
          className="h-1.5 w-20 rounded-full"
          style={{
            background: `linear-gradient(to right, ${violetAt(
              minShare / maxShare,
            )}, ${violetAt(1)})`,
          }}
        />
        <span className="text-[11px] tabular-nums text-text-tertiary">
          {fmtPct(maxShare, 0)}
        </span>
        <span className="text-[11px] text-text-tertiary">share of voters</span>
      </div>

      {tip ? (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-border-default bg-surface-raised px-2 py-1 text-xs shadow-md"
          style={{
            left: tip.x,
            top: tip.y,
            transform: `translate(${flipX ? "calc(-100% - 10px)" : "10px"}, ${
              flipY ? "calc(-100% - 10px)" : "10px"
            })`,
          }}
        >
          <p className="font-display font-semibold text-text-primary">{tip.name}</p>
          <p className="tabular-nums text-text-secondary">
            {fmtPct(tip.share, 0)} of voters
            {tip.voters !== undefined && tip.voters > 0
              ? ` · ${fmtInt(tip.voters)} voters`
              : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
