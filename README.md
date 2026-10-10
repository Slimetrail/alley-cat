# Alley Cat Run
Canvas 2D pseudo-3D endless runner, no build step, no external assets, offline PWA.
Files: index.html, game.js (all game + procedural art), sw.js (network-first, versioned cache "alleycat-v1"), manifest.webmanifest, icons/, test.py (Playwright).
Cats: edit CAT_NAMES / CATS at top of game.js. Bump ?v= in index.html + VER in sw.js on each release.
Run locally: python3 -m http.server 8813 ; tests: python3 test.py
