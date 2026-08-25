# MkulimaCollect — Production Polish

This repository contains the MkulimaCollect app (web + native) with an offline-first architecture.

Getting started

- Install dependencies: npm ci
- Run dev server: npm run dev
- Run tests: npm test
- Run E2E tests (Playwright): npm run install:browsers && npm run test:e2e

Release

- Build web: npm run build:web
- Use EAS for native builds (see docs/deploy-instructions.md)
