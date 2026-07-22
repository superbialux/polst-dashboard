'use client'

import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

// Map each US state (by name) to one of four regions.
const STATE_REGION: Record<string, 'West' | 'Midwest' | 'South' | 'Northeast'> =
  {
    Washington: 'West',
    Oregon: 'West',
    California: 'West',
    Nevada: 'West',
    Idaho: 'West',
    Montana: 'West',
    Wyoming: 'West',
    Utah: 'West',
    Colorado: 'West',
    Arizona: 'West',
    'New Mexico': 'West',
    Alaska: 'West',
    Hawaii: 'West',
    'North Dakota': 'Midwest',
    'South Dakota': 'Midwest',
    Nebraska: 'Midwest',
    Kansas: 'Midwest',
    Minnesota: 'Midwest',
    Iowa: 'Midwest',
    Missouri: 'Midwest',
    Wisconsin: 'Midwest',
    Illinois: 'Midwest',
    Indiana: 'Midwest',
    Michigan: 'Midwest',
    Ohio: 'Midwest',
    Oklahoma: 'South',
    Texas: 'South',
    Arkansas: 'South',
    Louisiana: 'South',
    Mississippi: 'South',
    Alabama: 'South',
    Tennessee: 'South',
    Kentucky: 'South',
    Georgia: 'South',
    Florida: 'South',
    'South Carolina': 'South',
    'North Carolina': 'South',
    Virginia: 'South',
    'West Virginia': 'South',
    Maryland: 'South',
    Delaware: 'South',
    'District of Columbia': 'South',
    Pennsylvania: 'Northeast',
    'New Jersey': 'Northeast',
    'New York': 'Northeast',
    Connecticut: 'Northeast',
    'Rhode Island': 'Northeast',
    Massachusetts: 'Northeast',
    Vermont: 'Northeast',
    'New Hampshire': 'Northeast',
    Maine: 'Northeast',
  }

const REGION_COLOR: Record<string, string> = {
  West: 'var(--chart-1)',
  Northeast: 'var(--chart-2)',
  South: 'var(--chart-3)',
  Midwest: 'var(--chart-4)',
}

export function RegionMap({
  data,
}: {
  data: { region: string; value: number }[]
}) {
  const valueByRegion = Object.fromEntries(data.map((d) => [d.region, d.value]))
  // Higher value = stronger fill opacity
  const max = Math.max(...data.map((d) => d.value))

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 850 }}
          width={800}
          height={420}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name as string
                const region = STATE_REGION[name]
                const value = region ? valueByRegion[region] ?? 0 : 0
                const opacity = region ? 0.35 + (value / max) * 0.65 : 0.15
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={region ? REGION_COLOR[region] : 'var(--muted)'}
                    fillOpacity={opacity}
                    stroke="var(--card)"
                    strokeWidth={0.75}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fillOpacity: 1 },
                      pressed: { outline: 'none' },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.map((d) => (
          <li key={d.region} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ background: REGION_COLOR[d.region] }}
            />
            <span className="text-muted-foreground">{d.region}</span>
            <span className="ml-auto font-medium tabular-nums">{d.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
