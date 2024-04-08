# myrelay.page

Your relay is awesome, its landing page should be too.

<img width="1544" alt="Screen Shot 2024-04-09 at 12 34 04 AM" src="https://github.com/sandwichfarm/myrelay.page/assets/299465/5298b48a-2a6e-4c89-b5af-d3e3bd830c81">

## why
That websocket URI representing your relay is floating all of the internet now. It's canonical `https` shouldn't be a `500`, a blank page or some random page. + I've wanted to do this since early 2023. 

## overview 
SvelteKit CSR site with SSR disabled that implements `ndk`, `nostr-zap` and `@nostrwatch/nocap`. Utilizes `NIP-65`, `NIP-66`, `NIP-78` and `NIP-115`. 

**Why SvelteKit if no SSR?**: No justification other than habit. Convert it in a PR and I won't complain. 

## features 
- General
  - [x] `tailwind`  
  - [x] `shadcn-svelete` UI components 
  - [x] Progressive load w/skeletons
- blocks
  - [x] nip-11
  - [x] operator profile/feed
  - [x] map
  - [x] relay feed
  - [ ] speed test (need to patch @nostrwatch/nocap)
- Stateful meta-data 
  - [x] nip-11
  - [x] operator profile
  - [x] operator notes
  - [x] notes from relay
  - [x] NIP-19 encoded nevent jumps
  - [x] Relay Geodata
  - [x] NIP-66 Monitor Data
  - [ ] Uptime
- Authed User Interactivity
  - [x] Login
  - [x] Add relay to relay list [`10002`]
  - [x] Zap relay operator
  - [ ] Following relay operator  
  - [x] "People you follow who are here"
  - [ ] "Notes you have here"
- No-build Customization via NIP-78
  - general
    - [ ] Theme
    - [ ] Show/hide blocks
    - [ ] Per block customization
    - [ ] Hide login
    - [ ] Disable "Join Relay"
  - Runtime-imported CSR blocks (svelte)
    - [ ] http/https  
      - [ ] custom block imports 
      - [ ] custom block options
    - [ ] git
      - [ ] custom block imports 
      - [ ] custom block options 
    - [ ] blossom
      - [ ] custom block imports 
      - [ ] custom block options
  - Internationalization (i18n)
    - [ ] i18n mapped language
    - [ ] NIP-78 overrides

## dev

_early alpha_, things will change, but have at it. 

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
You can test relays on localhost by appending `?url=relay.snort.social` for instance. 

Image is not yet on a registry. 

### serving from canonical

Depending on your relay software, you'll need to do some proxying to direct websocket, NIP-11 and/or NIP-05 traffic to your relay, and `https` traffic without `application/nostr+json` to a page. 

#### nginx/haproxy/caddy
_examples soon_, see https://relaypag.es for a quick example. 

#### apache
_examples never_

