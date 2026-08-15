# Static map — source and how it was made

`src/assets/location/mapa.jpg` is used by `LocationBlock` on `/` and `/contato`.

**Address geocoded:** Av. Onze de Junho, 1070, Sala 710, Vila Clementino, São Paulo - SP,
04041-004 — via [Nominatim](https://nominatim.openstreetmap.org) (OpenStreetMap's free geocoder).
Structured query (street/city/state/postalcode/country) resolved to a house-level match:
lat `-23.6014024`, lon `-46.6472339`. Sanity-checked against São Paulo's known bounding box before
use — Nominatim occasionally tags the parcel under an adjacent official district name
("Mirandópolis"/"Saúde") rather than "Vila Clementino"; that's OSM's district boundary data, not a
wrong location — the coordinates match the street address regardless of district label.

**Image:** six raster tiles from `tile.openstreetmap.org` (zoom 16, the standard Mapnik layer),
fetched with a descriptive `User-Agent` per their
[tile usage policy](https://operations.osmfoundation.org/policies/tiles/) and stitched into one
768×512 (exactly 3:2) image with a hand-drawn pin at the precise geocoded pixel position. No
static-map compositing API was used (`staticmap.openstreetmap.de` didn't resolve from this
environment; Mapbox/Google static-map equivalents need an API key nobody has provided) — raw
tiles + a marker drawn in Pillow was the keyless path that actually worked.

**Attribution requirement:** OSM's tile usage policy requires a visible copyright notice wherever
the tiles render. `LocationBlock` shows "Mapa: dados do OpenStreetMap" under the image whenever
`mapa` is passed — see the note in `LocationBlock.astro`'s docstring: that caption is tied to
_this_ image source, not generic. If the map image is ever replaced with a different source
(Google Static Maps, Mapbox, a client-provided graphic), that caption needs to change or come out
with it.

**If this needs regenerating** (address changes, higher resolution, different zoom): the fetch was
a one-off Python script (geocode via Nominatim → compute slippy-map tile x/y at the target zoom →
fetch a small grid of tiles around the center tile → stitch with Pillow → draw a pin at the exact
fractional pixel position). No dependency was added to the project for this — it's not part of the
build.
