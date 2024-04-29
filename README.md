# myrelay.page

Your relay is awesome, its landing page should be too.

_**A nostr.watch R&D project made possible by [OpenSats](https://opensats.org)**_

<img width="1019" alt="Screen Shot 2024-04-10 at 5 26 19 AM" src="https://github.com/sandwichfarm/myrelay.page/assets/299465/338cd5d3-21a5-492a-8e2d-ac1d128acfa2">

## why
That websocket URI representing your relay is floating all over the internet now. Its canonical `https` shouldn't be a `500`, a blank page or some random page. + I both need to do this to eat my own dog food and it's something I've wanted to do since early 2023.  

## overview 
SvelteKit CSR site with SSR disabled that implements `ndk`, `nostr-zap` and `@nostrwatch/nocap`. Utilizes `NIP-65`, `NIP-66`, `NIP-78` and `NIP-115`. 

**Why SvelteKit if no SSR?**: No justification other than habit. Convert it in a PR and I won't complain. 

## Try it without build/deploy
You can preview your relay on myrelay.page and even edit it without building or deploying it through the netlify build (which is always latest). **Important: Works for `wss` relays only!** Also see [requirements for editing](#important-notes)

`https://relaypage.netlify.app/?url=$YOUR_RELAY_URL`

for example
- [snort](https://relaypage.netlify.app/?url=wss://relay.snort.social)
- [damus](https://relaypage.netlify.app/?url=wss://relay.damus.io)
- [damus](https://relaypage.netlify.app/?url=wss://purplepag.es)
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
pnpm install
pnpm build
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
pnpm dev
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

