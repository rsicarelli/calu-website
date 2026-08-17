# Stock photos — temporary, until the clinic's real photos arrive

Every image below is a Pexels stock photo, chosen to stand in for the clinic's own photography
(see `CLAUDE.md` — real photos of the space, staff, or patients require client approval first).
Pexels' license permits commercial use and modification without requiring attribution, but it's
recorded here anyway for traceability, and so whoever replaces these with real photos later knows
exactly what to swap out.

Team portraits (`equipe/*.md` `retrato`) were deliberately left as `BrandPlaceholder` — attaching a
real stranger's face to a specific named professional's bio reads too close to a placeholder that
could pass as real, which is exactly what CLAUDE.md's rule against invented-realistic placeholders
exists to prevent. That call is documented here in case someone revisits it.

| Content entry                             | File                                                   | Pexels photo                                                                                                                              | Photographer                                                       |
| ----------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `home/home.md` → `hero.imagem`            | `src/content/home/hero.jpg`                            | [photo 36833354](https://www.pexels.com/photo/modern-pilates-studio-with-reformers-36833354/)                                             | [Paulina Vargas](https://www.pexels.com/@paulina-vargas-490121449) |
| `servicos/pilates-clinico.md`             | `src/content/servicos/pilates-clinico.jpg`             | [photo 8769163](https://www.pexels.com/photo/women-in-the-gym-using-the-exercise-equipment-8769163/)                                      | [Gustavo Fring](https://www.pexels.com/@gustavo-fring)             |
| `servicos/pilates-solo.md`                | `src/content/servicos/pilates-solo.jpg`                | [photo 8436571](https://www.pexels.com/photo/people-doing-yoga-8436571/)                                                                  | [Yan Krukau](https://www.pexels.com/@yankrukov)                    |
| `servicos/fisioterapia-pelvica.md`        | `src/content/servicos/fisioterapia-pelvica.jpg`        | [photo 5793651](https://www.pexels.com/photo/woman-in-white-dress-up-shirt-touching-the-back-of-knees-of-woman-in-white-t-shirt-5793651/) | [Yan Krukau](https://www.pexels.com/@yankrukov)                    |
| `servicos/fisioterapia-ortopedica.md`     | `src/content/servicos/fisioterapia-ortopedica.jpg`     | [photo 4506112](https://www.pexels.com/photo/chiropractor-examining-female-patient-with-reached-arm-and-dumbbell-4506112/)                | Karola G — [Kaboompics](https://www.pexels.com/@karola-g)          |
| `servicos/reabilitacao-pos-operatoria.md` | `src/content/servicos/reabilitacao-pos-operatoria.jpg` | [photo 4506166](https://www.pexels.com/photo/crop-anonymous-woman-stretching-elastic-band-near-professional-chiropractor-4506166/)        | Karola G — [Kaboompics](https://www.pexels.com/@karola-g)          |

## Selection criteria applied

Rejected candidates from an earlier pass (Openverse, no API key) for having visible equipment
branding, dated/low-quality look, or identifiable bystanders in an amateur snapshot. The bar for
these six: no visible brand logos or text on equipment/apparel, no dated or low-quality look,
subjects are professionally posed stock models (not candid bystanders), each photo genuinely
depicts the specific service it's attached to, and the tones fit the site's warm/neutral palette.

## Gallery — `Gallery.astro` on the Home page and each service page

Additional photos for the `galeria` field, distinct from the six above (no photo repeats across
sections). Same license/attribution note as above, and the same bar — one candidate (a shirtless
man on a gym floor mat, ID 4804307) was rejected on sight for not fitting a clinical/professional
tone and swapped for photo 6111610 below.

| Content entry                                     | File                                                             | Pexels photo                                                                                             | Photographer                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `home/home.md` → `galeria.imagens[0]`             | `src/content/home/galeria-1.jpg`                                 | [photo 25596894](https://www.pexels.com/photo/pilates-reformers-in-bright-room-25596894/)                | [Ahmet Kurt](https://www.pexels.com/@ahmetkurt)                                              |
| `home/home.md` → `galeria.imagens[1]`             | `src/content/home/galeria-2.png`                                 | [photo 18499500](https://www.pexels.com/photo/a-modern-fitness-studio-18499500/)                         | [Lê Đức](https://www.pexels.com/@lngdik23)                                                   |
| `home/home.md` → `galeria.imagens[2]`             | `src/content/home/galeria-3.jpg`                                 | [photo 6339398](https://www.pexels.com/photo/a-group-of-people-sitting-on-mats-stretching-6339398/)      | [Pavel Danilyuk](https://www.pexels.com/@pavel-danilyuk)                                     |
| `servicos/pilates-solo.md` → `galeria[0]`         | `src/content/servicos/pilates-solo-galeria-1.jpg`                | [photo 6339391](https://www.pexels.com/photo/close-up-shot-of-people-sitting-on-yoga-mats-6339391/)      | [Pavel Danilyuk](https://www.pexels.com/@pavel-danilyuk)                                     |
| `servicos/pilates-solo.md` → `galeria[1]`         | `src/content/servicos/pilates-solo-galeria-2.jpg`                | [photo 6339447](https://www.pexels.com/photo/two-women-exercising-in-a-gym-6339447/)                     | [Pavel Danilyuk](https://www.pexels.com/@pavel-danilyuk)                                     |
| `servicos/pilates-clinico.md` → `galeria[0]`      | `src/content/servicos/pilates-clinico-galeria-1.jpg`             | [photo 8769162](https://www.pexels.com/photo/rehabilitation-with-use-of-equipment-8769162/)              | [Gustavo Fring](https://www.pexels.com/@gustavo-fring)                                       |
| `servicos/pilates-clinico.md` → `galeria[1]`      | `src/content/servicos/pilates-clinico-galeria-2.jpg`             | [photo 5992858](https://www.pexels.com/photo/therapist-helping-a-client-in-her-exercises-5992858/)       | [Kampus Production](https://www.pexels.com/@kampus)                                          |
| `servicos/fisioterapia-ortopedica.md` → `[0]`     | `src/content/servicos/fisioterapia-ortopedica-galeria-1.jpg`     | [photo 20860625](https://www.pexels.com/photo/physiotherapist-and-patient-stretching-leg-20860625/)      | [Funkcinės Terapijos Centras](https://www.pexels.com/@funkcines-terapijos-centras-927573878) |
| `servicos/fisioterapia-ortopedica.md` → `[1]`     | `src/content/servicos/fisioterapia-ortopedica-galeria-2.jpg`     | [photo 20860595](https://www.pexels.com/photo/physiotherapist-holding-a-patients-knee-20860595/)         | [Funkcinės Terapijos Centras](https://www.pexels.com/@funkcines-terapijos-centras-927573878) |
| `servicos/fisioterapia-pelvica.md` → `[0]`        | `src/content/servicos/fisioterapia-pelvica-galeria-1.jpg`        | [photo 20860586](https://www.pexels.com/photo/physiotherapist-looking-at-patient-back-20860586/)         | [Funkcinės Terapijos Centras](https://www.pexels.com/@funkcines-terapijos-centras-927573878) |
| `servicos/fisioterapia-pelvica.md` → `[1]`        | `src/content/servicos/fisioterapia-pelvica-galeria-2.jpg`        | [photo 20860590](https://www.pexels.com/photo/bent-over-patient-examined-by-a-physiotherapist-20860590/) | [Funkcinės Terapijos Centras](https://www.pexels.com/@funkcines-terapijos-centras-927573878) |
| `servicos/reabilitacao-pos-operatoria.md` → `[0]` | `src/content/servicos/reabilitacao-pos-operatoria-galeria-1.jpg` | [photo 5793792](https://www.pexels.com/photo/a-woman-doing-therapy-5793792/)                             | [Yan Krukau](https://www.pexels.com/@yankrukov)                                              |
| `servicos/reabilitacao-pos-operatoria.md` → `[1]` | `src/content/servicos/reabilitacao-pos-operatoria-galeria-2.jpg` | [photo 6111610](https://www.pexels.com/photo/a-woman-in-gray-tank-top-working-out-in-the-gym-6111610/)   | [Kampus Production](https://www.pexels.com/@kampus)                                          |

## Video — `Gallery` component, Home page only

One YouTube video, used as a lazy-loaded facade (see `Gallery.astro`'s docstring — the iframe is
never eager-loaded, only built on click). Not repeated on service pages: five identical embeds
site-wide seemed excessive for both weight and UX, so it lives once, on the Home gallery, as a
general showcase rather than service-specific content.

Picked by searching for reputable, embeddable Pilates demonstration channels, verifying
embeddability and metadata via YouTube's official keyless oEmbed endpoint (confirms the video
exists, is embeddable, and returns real title/channel data — not a guessed/fabricated URL), and
visually inspecting the official thumbnail before use.

- **Video:** [Pilates Reformer Demo - part 1](https://www.youtube.com/watch?v=fITOM64Kg6g)
  (ID `fITOM64Kg6g`)
- **Channel:** [Westwood Pilates](https://www.youtube.com/@WestwoodPilates)
- **Why this one:** purely descriptive title, no result-promising language, no competing São
  Paulo clinic branding, thumbnail shows a clean, professional reformer studio session — nothing
  to review before shipping as a stand-in. Treat this the same as the stock photos: a
  quality-bar-cleared placeholder, easy to swap for different content later if wanted.
- Thumbnail self-hosted at `src/assets/video/pilates-video-thumb.jpg`, downloaded from YouTube's
  own official `i.ytimg.com/vi/<id>/hqdefault.jpg` endpoint (not a screenshot or a third-party
  mirror).
