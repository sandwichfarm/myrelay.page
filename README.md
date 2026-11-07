# myrelay.page

Your relay is awesome, its landing page should be too.

_**A nostr.watch R&D project made possible by [OpenSats](https://opensats.org)**_

<img width="1019" alt="Screen Shot 2024-04-10 at 5 26 19 AM" src="https://github.com/sandwichfarm/myrelay.page/assets/299465/338cd5d3-21a5-492a-8e2d-ac1d128acfa2">

## why
That websocket URI representing your relay is floating all over the internet now. Its canonical `https` shouldn't be a `500`, a blank page or some random page. + I both need to do this to eat my own dog food and it's something I've wanted to do since early 2023.  

## overview 
SvelteKit client-rendered site using Applesauce v7 for Nostr connections, event validation, discovery, and NIP-07 signing. Uses NIP-11, NIP-65, NIP-66, and NIP-78.

## live demos
- [wss://lunchbox.sandwich.farm](https://lunchbox.sandwich.farm)
- [wss://relay.nostr.watch](https://relay.nostr.watch)
- [wss://relaypag.es](https://relaypag.es)
- [wss://user.kindpag.es](https://user.kindpag.es)

## "try before you buy"
`https://relaypage.netlify.app/?url=wss://your.relay`

for example
- [snort](https://relaypage.netlify.app/?url=wss://relay.snort.social)
- [damus](https://relaypage.netlify.app/?url=wss://relay.damus.io)
- [purplepag.es](https://relaypage.netlify.app/?url=wss://purplepag.es)
- [nostr.land](https://relaypage.netlify.app/?url=wss://nostr.land)

## todo 
- general
  - [x] `tailwind`  
  - [x] `shadcn-svelete` UI components 
  - [x] progressive load w/skeletons
  - [x] NIP-07 support
  - [ ] NIP-46 support
  - [x] mobile compat
  - [x] options generic
  - [ ] manually set URL via `.env` for build-time URL setting for explicit control and unhandled edge-cases
- unique blocks
  - [x] nip-11
  - [x] operator profile/feed
  - [x] map
  - [x] relay feed
  - [ ] speed test (need to patch @nostrwatch/nocap)
- repeatable blocks
  - [x] html
  - [x] image
  - [x] md
  - [x] feed
- stateful meta-data 
  - [x] nip-11
  - [x] operator profile
  - [x] operator notes
  - [x] notes from relay
  - [x] long-form content feed
  - [x] NIP-19 encoded nevent jumps
  - [x] relay Geodata
  - [ ] NIP-66 Monitor Data
    - [x] seen by monitors
    - [x] round-trip time of monitors
    - [x] map reactiveness
    - [ ] ssl
  - [ ] uptime
- parsing
  - [x] notes: images
  - [x] notes: videos
  - [ ] notes: spotify
  - [ ] notes: tidal
  - [ ] notes: NIP-19 encoded `nostr:` links
- authed User Interactivity
  - [x] login
  - [x] add relay to relay list [`10002`]
  - [x] zap relay operator
  - [ ] follow relay operator  
  - [x] "People you follow who are here"
  - [ ] "Notes you have here"
- no-build customization via NIP-78
  - general
    - [ ] ~theme import~
    - [x] show/hide blocks
    - [x] order blocks
    - [x] per block customization
    - [ ] hide login
    - [ ] disable join
  - theming 
    - [ ] default runtime themes
    - [ ] theme selection
    - [ ] theme customization
  - runtime-imported CSR blocks (svelte)
    - [ ] http/https  
      - [ ] custom block imports 
      - [ ] custom block options
    - [ ] git
      - [ ] custom block imports 
      - [ ] custom block options 
    - [ ] blossom
      - [ ] custom block imports 
      - [ ] custom block options
  - internationalization (i18n)
    - [ ] i18n mapped language
    - [ ] NIP-78 overrides

## Deploy

_early alpha_, things will change, history will be full of haphazard commit messages, force pushes to reset history eminent ... but have at it. 

### build 

```
npm ci
npm run build
```

Artifacts will end up in the `build` directory. You just neeed to serve them. 

### docker
```
docker build .
```
_Image is not available on a registry yet_

### Important Notes

1. To use the editor, you need to login with the pubkey listed in your NIP-11. The pubkey **must be hex in alignment with NIP-11, not your NIP-19 encoded npub**
2. `myrelay.page` is self-configuring, you don't need to set a URL. In the event it is not working more than likely, it's one of the following causes:
  - If you run a `wss` relay, you must serve _myrelay.page_ from `https`, 
  - if you run a `ws` (unsecured) relay, for instance from onion or a local relay, you must serve _myrelay.page_ from `http`
  - You are not serving _myrelay.page_ from the `https` url equivalent of your relay, see below if testing locally. 

## dev 

```
npm run dev
```
You can show a myrelay.page for any relay from `localhost` by appending `?url=wss://relay.snort.social` for instance. 

### serving from relay canonical

Depending on your relay software, you'll need to do some proxying to direct websocket, NIP-11 and/or NIP-05 traffic to your relay, and `http(s)` traffic without `application/nostr+json` to the myrelay.page static path or port.

#### nginx/caddy/haproxy
##### caddy
- strfry: see `caddy/strfry/Caddyfile`
- nostream: soon
- nostr-rs-relay: soon

##### nginx
soon

##### haproxy
soon 


## Operator configuration and relay discovery

The page reads the operator's hex public key from NIP-11, discovers their latest
kind 10002 relay list on discovery relays and broad indexing relays, then requests
kind 30078 configuration from their **write relays**. The target relay and broad
relays are also checked for replicas. Read-only NIP-65 entries are not used as an
outbox. Discovery currently includes purplepag.es, index.hzrd149.com, Ditto,
Damus, and nos.lol; see `src/lib/core/nostr.ts` for the lists and deadlines.

The original address (`myrelay.page/<normalized relay URL>operator@<hex pubkey>`)
and jsonpack payload are preserved. No data conversion is needed. A copy that
existed only on an unavailable relay cannot be recovered: the operator can use
the editor to republish from an available copy or recreate the configuration.
Missing config falls back to defaults; unavailable NIP-11 finishes with an
explanatory message instead of leaving a loading screen.

Publishing requires the NIP-11 operator's NIP-07 signer and at least one NIP-65
write relay. Edits are committed only after at least one relay acknowledges the
event. Concurrent saves share one request, unchanged saves do nothing, and a
failed save retries the same signed event. Edits made during a save stay dirty.
Signing cancellation, logout, and rejected publishes leave an actionable error
and preserve the draft. No public events are published by the tests.

## Verification

Node 22 or newer is recommended. Dependencies are locked with npm.

```sh
npm ci
npm test
npm run check
npm run lint
npm run build
```

Tests cover signed relay responses, invalid events, deterministic replacement,
timeouts, teardown, discovery fallback and write markers, legacy configuration,
config editing, publish acknowledgements/retries, login races, join/leave,
feeds, profiles, follows, monitor projections, and component rendering.

For browser integration tests, install Playwright separately (it is a test tool,
not an application dependency), start `npm run preview -- --host 127.0.0.1 --port 5193`,
and run:

```sh
npm install --prefix /tmp/myrelay-browser-tools playwright@1.64.1
/tmp/myrelay-browser-tools/node_modules/.bin/playwright install chromium
PLAYWRIGHT_MODULE=/tmp/myrelay-browser-tools/node_modules/playwright/index.mjs npm run test:browser
```

The browser suite intercepts NIP-11 and WebSocket traffic with signed fixtures,
verifies that config is found only in the discovered owner outbox, checks mobile
and missing-data rendering, and exercises owner login plus rejected/successful
save retries. Screenshots are written to `docs/proofs` (override `PROOF_DIR`).
`BROWSER_BASE_URL` can point to another local preview. CI runs the same suite
against the production build and uploads screenshots.
