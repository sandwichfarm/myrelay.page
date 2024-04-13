# myrelay.page

Your relay is awesome, its landing page should be too.

_**A nostr.watch R&D project made possible by [OpenSats](https://opensats.org)**_

<img width="1019" alt="Screen Shot 2024-04-10 at 5 26 19 AM" src="https://github.com/sandwichfarm/myrelay.page/assets/299465/338cd5d3-21a5-492a-8e2d-ac1d128acfa2">

## why
That websocket URI representing your relay is floating all over the internet now. Its canonical `https` shouldn't be a `500`, a blank page or some random page. + I both need to do this to eat my own dog food and it's something I've wanted to do since early 2023.  

## overview 
SvelteKit CSR site with SSR disabled that implements `ndk`, `nostr-zap` and `@nostrwatch/nocap`. Utilizes `NIP-65`, `NIP-66`, `NIP-78` and `NIP-115`. 

**Why SvelteKit if no SSR?**: No justification other than habit. Convert it in a PR and I won't complain. 

## todo 
- general
  - [x] `tailwind`  
  - [x] `shadcn-svelete` UI components 
  - [x] progressive load w/skeletons
  - [x] NIP-07 support
  - [ ] NIP-46 support
  - [ ] mobile compat
- blocks
  - [x] nip-11
  - [x] operator profile/feed
  - [x] map
  - [x] relay feed
  - [ ] speed test (need to patch @nostrwatch/nocap)
- stateful meta-data 
  - [x] nip-11
  - [x] operator profile
  - [x] operator notes
  - [x] notes from relay
  - [ ] long-form content feed
  - [x] NIP-19 encoded nevent jumps
  - [x] relay Geodata
  - [ ] NIP-66 Monitor Data
    - [x] seen by monitors
    - [x] round-trip time of monitors
    - [ ] map reactiveness
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
    - [ ] theme import
    - [x] show/hide blocks
    - [x] order blocks
    - [ ] per block customization
    - [ ] hide login
    - [ ] disable join
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

## dev

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

### notes
You can test relays on localhost by appending `?url=wss://relay.snort.social` for instance. 

Image is not yet on a registry. 

### serving from canonical

Depending on your relay software, you'll need to do some proxying to direct websocket, NIP-11 and/or NIP-05 traffic to your relay, and `https` traffic without `application/nostr+json` to a page. 

#### nginx/caddy/haproxy
_examples soon_, see https://relaypag.es for a live example 

