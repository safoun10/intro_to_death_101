# Death 101 Visual Blog - Build Process & Plan

This document serves as the architectural record for the "Death 101" visual blog project, to be understood and maintained by both human authors and LLMs.

## Core Philosophy
1.  **Read-only Source:** `death.md` is the absolute source of truth. It is never edited by the build process.
2.  **Intent First:** The visual experience supports, not competes with, the philosophical text.
3.  **Clean & Vanilla:** Use standard browser APIs (IntersectionObserver, Canvas) + minimal dependencies (Lenis for scroll).
4.  **Mobile-first:** The design flows from mobile to desktop.

## Build Pipeline
1.  **Parsing:** `scripts/build-content.mjs` transforms `death.md` into structured JSON (`src/data/content.json`).
2.  **Generation:** The build process creates a `dist/` directory containing the static site.
3.  **Separation:** Content structure (JSON) is decoupled from layout (HTML/CSS/JS).

## Project Roadmap
- [x] **Phase 1: Foundation**
    - [x] Scaffold project structure.
    - [x] Establish read-only rules for `death.md`.
    - [x] Implement build parser.
- [ ] **Phase 2: Visual System**
    - [ ] Create base CSS tokens (colors, typography).
    - [ ] Build layout and thematic shell (section transitions).
- [ ] **Phase 3: Motion Layer**
    - [ ] Implement Lenis.
    - [ ] Add subtle scroll-reveal animations.
- [ ] **Phase 4: Polish**
    - [ ] Final visual check on responsiveness.
    - [ ] SEO and performance optimization.

## Current State
Phase 1 is complete. `content.json` is successfully generated from the provided `death.md`. The project is ready for UI development.
