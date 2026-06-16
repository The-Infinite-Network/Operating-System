# Legacy Layout Crosswalk and Adoption Plan

Updated: 2026-06-16  
Status: Current-state donor crosswalk  
Purpose: Record how preserved legacy HTML artifacts map into the clean `Operating-System` runtime and `Infinite-Earth` public surfaces without turning those donor files into active pages.

## Adoption Rules

- Legacy files are donor/reference material only.
- `Operating-System` owns the INOS runtime shell.
- `Infinite-Earth` owns public business and guest-facing site surfaces.
- `IeIntranetApp` and `IeHqSpine` remain INOS runtime surfaces, not separate localhost apps.
- One launcher, one shell runtime, one localhost primary surface.
- No direct copy/paste of legacy HTML into active production pages.
- No new top-level runtime roots created from donor files.

## Crosswalk

| Donor source file | Primary target surface | Classification | Adoption mode | Adoption intent | Constraints |
| --- | --- | --- | --- | --- | --- |
| `C:\dev\~devantigravity-playground\1. Nullkode Apps\INOS\INOS_Foundation.html` | `C:\dev\The-Infinite-Network\Operating-System\inos-shell\src\pages\Foundation.tsx` plus shell left-rail/navigation components | Runtime / internal | Layout donor | Use as the strongest donor for Foundation page structure, left rail hierarchy, and shell visual framing | Single-shell only; no standalone Foundation app |
| `C:\dev\~devantigravity-playground\1. Nullkode Apps\INOS\index.html` | `C:\dev\The-Infinite-Network\Operating-System\inos-shell\src\layout\TopHeader.tsx`, `src\layout\AppSpine.tsx`, `src\pages\Home.tsx`, `src\pages\Guilds.tsx` | Runtime / internal | Layout donor | Use for top header, nav rhythm, scope controls, and control-tower / guild framing | Preserve current routes; do not embed raw HTML |
| `C:\dev\~devantigravity-playground\1. Nullkode Apps\E0\index.html` | `C:\dev\The-Infinite-Network\Operating-System\inos-shell` responsive shell mode and mobile presentation layer | Runtime / internal | Component donor | Use as the donor for Android/mobile-first shell behavior and compact viewport presentation | No separate Android localhost; responsive mode inside the main shell only |
| `C:\Users\lross\~devantigravity-playground\InfiniteNetworkSystem\inos-shell\inos_epoch0.html` | `C:\dev\The-Infinite-Network\Operating-System\inos-shell\src\pages\RoomMe.tsx` and related personal-scope interactions | Runtime / internal | Layout donor | Use for `My Room`, proof-of-living, mission/timeline posture, and shell-log interaction patterns | Must remain under the canonical INOS shell |
| `C:\dev\~devantigravity-playground\1. Nullkode Apps\Old Versions\IE Holdco\ie-e0-hco-spine.html` | `C:\dev\The-Infinite-Network\Operating-System\inos-shell\src\pages\IeHqSpine.tsx` and `src\pages\apps\IeIntranetApp.tsx` | Runtime / internal | Layout donor | Use for the IE holdco spine depth, registry framing, and entity/trust/asset surface composition | Holdco spine stays inside INOS; no second localhost app |
| `C:\dev\~devantigravity-playground\1. Nullkode Apps\CNGI Guest App\cngi-christmas-menu-heartline.html` | `C:\dev\The-Infinite-Network\Infinite-Earth\cngibakery.com\src` public pages | Public / guest | Layout donor | Use for CNGI seasonal hero, campaign banding, menu styling, and order/pickup framing | Public-site only; no INOS runtime adoption |
| `C:\Users\lross\~devantigravity-playground\Nullkode-Apps\OLD versions\Crumb and Get it Bakery\index.html` | Primary: `C:\dev\The-Infinite-Network\Infinite-Earth\cngibakery.com\src`; Secondary: future internal training module patterns inside `Operating-System\inos-shell` if split cleanly | Mixed public + internal legacy source | Reference only | Reuse selective bakery UX patterns for the public site; isolate any training/internals before reuse inside INOS | Do not import public bakery UX into INOS runtime; do not treat as a full replacement page |

## Runtime Track

### INOS shell donors

- `INOS_Foundation.html`
  - Primary adoption targets:
    - `Foundation.tsx`
    - shell left rail
    - section grouping and information density
- `INOS\index.html`
  - Primary adoption targets:
    - top header
    - nav cluster
    - scope controls
    - global/control-tower framing
- `E0\index.html`
  - Primary adoption targets:
    - compact/mobile shell behavior
    - Android-oriented presentation
- `inos_epoch0.html`
  - Primary adoption targets:
    - `RoomMe.tsx`
    - personal scope
    - proof-of-living and shell-log interactions
- `ie-e0-hco-spine.html`
  - Primary adoption targets:
    - `IeHqSpine.tsx`
    - `IeIntranetApp.tsx`
    - IE entity/trust/asset registry depth

### Runtime constraints

- Preserve current routes and runtime ownership.
- Refactor existing React pages/components instead of embedding raw legacy HTML.
- Keep one launcher and one localhost shell.
- Do not create separate IE holdco, E0, or training apps.

## Public Site Track

### CNGI donors

- `cngi-christmas-menu-heartline.html`
  - Primary adoption targets:
    - `Infinite-Earth\cngibakery.com\src\index.html`
    - seasonal campaign presentation
    - menu/order framing
- `OLD versions\Crumb and Get it Bakery\index.html`
  - Selective reuse only where the pattern belongs to public bakery UX
  - Internal/training concepts must be split out before any INOS reuse

### Public constraints

- Keep guest/public bakery UX inside `Infinite-Earth`.
- Preserve current public-site routing and files.
- Do not move guest-facing bakery behavior into the INOS runtime.
- Do not treat any donor file as a single-source replacement page.

## Immediate Next Safe Refactor Sequence

1. `Home` and `Foundation` shell structure against `INOS_Foundation.html` and `INOS\index.html`
2. `RoomMe` personal scope against `inos_epoch0.html`
3. `IeHqSpine` and `IeIntranetApp` against `ie-e0-hco-spine.html`
4. `cngibakery.com` public-site donor adoption from the CNGI guest files

## Explicit Non-Goals In This Wave

- No new localhost apps
- No active route pointed at raw legacy HTML
- No launcher split
- No repo-boundary changes between `Operating-System` and `Infinite-Earth`
- No public-site UX moved into INOS runtime
