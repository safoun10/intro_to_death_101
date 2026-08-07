---
description: Project conventions for INTRODUCTION TO DEATH 101 visual blog
alwaysApply: true
---

# Project conventions

- death.md is the author's personal manuscript — never edit it
- Site content is generated from death.md at build time into src/data/content.json
- Presentation metadata (themes, headlines) lives in content.config.json
- Keep vanilla HTML/CSS/JS; Lenis is the only external runtime dependency
- Design priority: intent/clarity first, theme second, motion third
- Mobile-first layout; desktop gets breathing room, not a different experience
