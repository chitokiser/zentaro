// One-off generator: converts world-atlas (Natural Earth 110m, ISC license) topojson
// into a static equirectangular-projected SVG path dataset for the World Spirits Map.
// Run with: node scripts/generate-world-map.js
// Requires world-atlas + topojson-client as local (non-persisted) devDependencies.
const fs = require("fs")
const path = require("path")
const world = require("world-atlas/countries-110m.json")
const topojson = require("topojson-client")

const WIDTH = 960
const HEIGHT = 480

function project([lon, lat]) {
  const x = (lon + 180) * (WIDTH / 360)
  const y = (90 - lat) * (HEIGHT / 180)
  return [Number(x.toFixed(2)), Number(y.toFixed(2))]
}

function ringToPath(ring) {
  return ring
    .map(([lon, lat], i) => {
      const [x, y] = project([lon, lat])
      return `${i === 0 ? "M" : "L"}${x},${y}`
    })
    .join(" ") + " Z"
}

function geometryToPath(geometry) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join(" ")
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map((poly) => poly.map(ringToPath).join(" ")).join(" ")
  }
  return ""
}

const geo = topojson.feature(world, world.objects.countries)

const countries = geo.features
  .filter((f) => f.properties.name !== "Antarctica")
  .map((f) => ({
    name: f.properties.name,
    path: geometryToPath(f.geometry),
  }))
  .filter((c) => c.path.length > 0)

const out = { width: WIDTH, height: HEIGHT, countries }
const outPath = path.join(__dirname, "..", "src", "data", "world-map.json")
fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(out))
console.log(`Wrote ${countries.length} country paths to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`)
