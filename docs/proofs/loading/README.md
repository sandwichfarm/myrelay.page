# Relay loading animation proof

Run the production build in one terminal:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5193
```

Then run the browser suite using the separately installed Playwright tool documented
in the root README:

```sh
PLAYWRIGHT_MODULE=/tmp/myrelay-browser-tools/node_modules/playwright/index.mjs \
  node tests/loading-browser.mjs
```

`BROWSER_BASE_URL` selects another preview URL; `LOADING_PROOF_DIR` selects another
output directory. The suite intercepts NIP-11 and WebSocket traffic with deterministic
signed fixtures. It holds network responses only in the test, so the actual loading
component and its transition can be examined without changing production timing.

- `desktop-frame-1.png`, `desktop-frame-2.png`, `desktop-frame-3.png`: successive
  frames of real WebGL motion. The suite compares rendered canvas images to ensure
  the scene changes over time.
- `desktop-discovery.png`: actual status change after NIP-11 completes.
- `mobile.png`, `compact.png`, `dark.png`: responsive composition and theme treatment.
- `reduced-motion.png`: still composition with no rendering loop or looping CSS.
- `fallback.png`, `context-loss.png`: readable vector fallback when WebGL is denied
  or its context is lost.
- `network-error.png`: failed NIP-11 settles into the explanatory error state.
- `motion.webm`: recorded desktop motion and the transition to loaded content.
- `motion.gif`: a 720px, 15fps preview transcoded from that recording for inline PR review.
- `verification.json`: browser-observed draw calls, frame counts, and matching
  resource creation/deletion totals for each scenario.

Additional assertions cover hidden/offscreen pause and resume, a 1.5× pixel-ratio
cap (tested at device pixel ratio 3), bounded draw calls, computed caption contrast
of at least 4.5:1 in light and dark themes, and a live status without busy ancestors
that would defer announcements. They also cover network failure, absence of
horizontal overflow at 320px and 390px, removal
of the loader after content is ready, and complete animation/resource teardown.
The WebGL probes exist only in the test's injected script, not in application code.

Headless Chromium may use SwiftShader. These captures demonstrate actual WebGL
rendering and lifecycle behavior; they do not claim hardware GPU throughput or
represent a frame-rate benchmark on every device.
