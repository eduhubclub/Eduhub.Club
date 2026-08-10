# Color roles checklist

Track **Edu.Hub** color roles against Color Test **Examples** and (later) app `theme.js`.

M3 DynamicScheme is the **accent baseline** only — not the product vocabulary.
See `applyEduHubRoleModel` in `colorThemeRoles.js`.

## Edu.Hub model

| Role | Meaning | Typical fill |
|------|---------|--------------|
| **Primary** | Key CTAs | Seed / adjusted primary |
| **Primary Container** | Default boards, cards, panels | White / dark slate (**alias of Surface**) |
| **Accent Container** | Soft tinted fills — use sparingly | Former M3 primaryContainer |
| **Surface / Surface Variant** | Chrome ladder | Neutral slate — seed does **not** tint |
| Secondary / Tertiary / Error | Accents + their soft containers | From MCU (+ harmony Scheme chips) |

Board layout:

- Primary column: Primary → On Primary → Primary Container → On Primary Container → Accent Container → On Accent Container
- Secondary / Tertiary / Error: main → on → container → on container
- Surfaces: Background / Surface / Surface Variant + On Surface / Outline
- Inverse + Scrim / Shadow

Playground data: `themeRoles.board` + `themeRoles.tokens`.
Primary is **pinned** to the adjusted seed so Harmony stays in sync.

## HubBrand Color vs Color Test

| Surface | Job now | Later |
|---------|---------|--------|
| **Color Test** | Lab — generator, Edu.Hub roles, harmony, examples | Feed locked choices into app `theme` + brand docs |
| **Color** (HubBrand) | Interim brand spot palette | Simplified Color Brand page |

Related code:

- Playground: `colorThemeRoles.js` → `themeRoles.tokens`
- App theme (not yet remapped): `web/src/shared/theme.js`
- Examples: `ColorTestView.jsx`
- Parked demos: `ColorTestExamples.jsx`

**How to use:** check a box when that role has a deliberate UI example (not only a swatch).

| Column | Meaning |
|--------|---------|
| Token | Present in playground `tokens` and/or app `theme` |
| Board | Shown on Color Theme role board |
| Example | Used in an Examples card |

---

## Accent — Primary

| Role | Edu.Hub use | Key | Token | Board | Example |
|------|-------------|-----|:-----:|:-----:|:-------:|
| Primary | Key CTAs | `colorPrimary` | [x] | [x] | [x] |
| On primary | Text on primary | `colorOnPrimary` | [x] | [x] | [x] |
| Primary container | Default board chrome (white/dark) | `colorPrimaryContainer` (= Surface) | [x] | [x] | [x] Class welcome / Choose a path |
| On primary container | Content on boards | `colorOnPrimaryContainer` | [x] | [x] | [x] |
| Accent container | Soft tint — rare | `colorAccentContainer` | [x] | [x] | [x] Learn more |
| On accent container | Content on accent container | `colorOnAccentContainer` | [x] | [x] | [x] |
| Primary light *(legacy)* | Alias of Accent Container | `colorPrimaryLight` | [x] | [ ] | [ ] prefer Accent Container |
| Primary variant | Darker primary | `colorPrimaryVariant` | [x] | [ ] | [ ] |

---

## Accent — Secondary / Tertiary / Error

| Role | Key | Token | Board | Example |
|------|-----|:-----:|:-----:|:-------:|
| Secondary + on + container | `colorSecondary*` | [x] | [x] | [ ] |
| Tertiary + on + container | `colorTertiary*` | [x] | [x] | [ ] |
| Error + on + container | `colorError*` | [x] | [x] | [ ] |

Scheme chips: Default (TonalSpot) / Neutral / Complement / Analogous / Triadic.
Error stays scheme-static vs seed.

---

## Surfaces & neutrals

| Role | Edu.Hub use | Key | Token | Board | Example |
|------|-------------|-----|:-----:|:-----:|:-------:|
| Background | Page / stage | `colorBackground` | [x] | [x] | [ ] |
| Surface | Alias of Primary Container | `colorSurface` | [x] | [x] | [x] (same as Primary Container) |
| Surface variant | Nested / recessed | `colorSurfaceVariant` | [x] | [x] | [ ] |
| On surface | Body on surface | `colorOnSurface` | [x] | [x] | [x] |
| On surface variant | Captions | `colorOnSurfaceVariant` | [x] | [x] | [x] |
| Outline | Board rims | `colorOutline` | [x] | [x] | [x] |
| Outline variant | Softer edges | `colorOutlineVariant` | [x] | [x] | [ ] |

M3 surface-container ladder is **not** product chrome — collapsed into Surface / Surface Variant.

---

## Inverse & utility

| Role | Key | Token | Board | Example |
|------|-----|:-----:|:-----:|:-------:|
| Inverse surface / on / primary | `colorInverse*` | [x] | [x] | [ ] |
| Scrim / Shadow | `colorScrim` / `colorShadow` | [x] | [x] | [ ] |

---

## Naming notes

| Edu.Hub | Closest M3 | Notes |
|---------|------------|-------|
| Primary Container | Surface | White/dark boards — **not** M3 primaryContainer |
| Accent Container | Primary container | Soft tint from MCU |
| Surface | Surface | Same hex as Primary Container |

**App `theme.js` still maps `colorPrimaryContainer` → soft tint (`activeBg`).** Remap when promoting Color Test decisions into the app theme.

Keep third-party brand marks on official colors (brand-logos rule).
