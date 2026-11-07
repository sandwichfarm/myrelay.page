# Browser proof

Captured from the production static build in headless Chromium using
`tests/browser.mjs`. Fixtures provide signed Nostr events through intercepted
WebSocket messages; the app uses the real Applesauce transport and validation.
No application mocks, real operator credentials, or public publishes are used.

- `desktop.png`: existing kind 30078 found only on the owner's discovered write relay; operator profile, note, and custom Markdown block loaded.
- `mobile.png`: same page at 390 × 844 with no horizontal overflow.
- `offline.png`: failed NIP-11 finishes loading with an explanation and no permanent skeletons.
- `defaults.png`: missing application event falls back to default blocks.
- `published.png`: owner login, config reset, rejection, and successful retry. Both submissions have the same signed event ID and go only to the owner's write relay.

See the root README for reproducible commands. Public relay uptime and a 100x
performance claim are not asserted by these deterministic tests.
