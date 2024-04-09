<script lang="ts">
  import { VisSingleContainer, VisTopoJSONMap } from '@unovis/svelte'
  import type { ColorAccessor } from '@unovis/svelte'

  import { WorldMapTopoJSON } from '@unovis/ts/maps'
  
  import { MapPointLabelPosition, type MapData, type MapLink } from '@unovis/ts'
  import type {DD} from '$lib/core/geocoded'

  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import Geolocation from 'svelte-geolocation'
  import { writable } from 'svelte/store';
  import type {Writable} from 'svelte/store'  
  import type { MyRelayPage } from '$lib/core/main';

  import crosshair from '$lib/assets/images/crosshair.svg';

  interface LinkDatum {
    color?: string;
  }

  type MapPoint = {
    id?: string;
    latitude: number;
    longitude: number;
    color?: string;
    label?: string;
    radius?: number;
    position?: MapPointLabelPosition;
    brightness?: number;
  }

  type MapArea = {
    id: string;
    name: string;
    color: string;
    cursor: string;
  }

  type MapLink = {
    source: MapPoint | string;
    target: MapPoint | string;
    color?: ColorAccessor<LinkDatum>;
    width?: number;
    cursor?: string;
  }

  // type ColorAccessor<LinkDatum> = ((d: LinkDatum) => string | null) | string;

  const mrp_context: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  let dd: DD | undefined = { lat: 0, lon: 0 }
  let data: Writable<MapData<MapArea, MapPoint, MapLink>> = writable({ areas: [] as MapArea[], points: [] as MapPoint[], links: [] as MapLink[] })
  let relayMapPoint: MapPoint;

  mrp_context.subscribe((_mrp) => {
    dd = _mrp.dd 
    console.log('dd', dd)
    if(!dd?.lat || !dd?.lon) return 

    relayMapPoint = { 
      id: 'relay', 
      latitude: dd.lat, 
      longitude: dd.lon, 
      color: 'blue',
      position: MapPointLabelPosition.Center
    }
    
    const monitorMapPoints: MapPoint[] = []
    const monitorLinks: MapLink[] = []
    const monitors = _mrp.ndk.monitors.all
    console.log('monitors', monitors)
    for ( const monitor of monitors) {
      console.log(monitor.geohash)
      const dd = monitor.dd
      const rtt =  _mrp.ndk?.monitors?.metaEventsFor(monitor.pubkey)?.[0].rtt?.open || undefined
      
      const point: MapPoint = { 
        id: monitor.geohash, 
        latitude: dd.lat, 
        longitude: dd.lon, 
        color: 'gray', 
        label: `${rtt}ms`, 
        radius: 3, 
        brightness: 0.1 
      }

      const link: MapLink = { 
        source: relayMapPoint.id || relayMapPoint, 
        target: point.id || point, 
        color: 'black', 
        cursor: 'crosshair', 
        width: Math.floor(Math.random() * 5) + 1 
      } 

      monitorMapPoints.push(point)
      monitorLinks.push(link)
    }
    data.update( (d) => {
      return {
        areas: [...d.areas || []],
        points: [...d.points || [], relayMapPoint, ...monitorMapPoints],
        links: [...d.links || [], ...monitorLinks]
      }
    });
    console.log('data', $data)
    
  });
  const addUserLocationToMap = (e: CustomEvent): void => {
    // if(!e?.detail?.coords) return
    const {latitude, longitude} = e.detail.coords
    const point: MapPoint = { 
      id: 'currentUser', 
      latitude, 
      longitude, 
      color: 'red', 
      label: 'you',
      radius: 10
    }
    let link: MapLink;
    if(point.id && relayMapPoint.id) {
      link = {
        source: relayMapPoint.id,
        target: point.id,
        color: 'black',
        cursor: 'crosshair',
        width: 10
      }
    } 
    data.update((d) => {
      d.points = [ ...d.points || [], point ]
      d.links = [...d.links || [], link ]
      return d
    })
    console.log('points', $data)
  }

  const pointLabel = (d: MapPoint) => d?.label
  const pointLabelPosition = (d: MapPoint): MapPointLabelPosition => d.position || MapPointLabelPosition.Bottom
  const pointLabelTextBrightnessRatio = (d: MapPoint): number => d.brightness || 0.90
  const linkColor = (d: MapLink): ColorAccessor<LinkDatum> => {
    console.log(`link color: `, d)
    return d?.color ?? 'gray'
  }
  // const linkWidth = (d: MapLink): number => d?.width || 2

  let getPosition = false;
  let coords: [number, number] | [] = [];
</script>

<Geolocation
  getPosition="{getPosition}"
  let:coords
  let:loading
  let:success
  let:error
  let:notSupported
  on:position="{(e) => addUserLocationToMap(e)}"
>
  <!-- {#if notSupported}
    Your browser does not support the Geolocation API.
  {:else}
    {#if loading}
      Loading...
    {/if}
    {#if success}
      {JSON.stringify(coords)}
    {/if}
    {#if error}
      An error occurred. {error.code} {error.message}
    {/if}
  {/if} -->
</Geolocation>
<div class="bg-gradient-to-b from-gray-100 to-white mt-10 pt-0 h-80  pb-5 px-5 rounded-lg relative">
  <h3 class="py-5 absolute top w-full mb-2 text-gray-600 scroll-m-20 text-xl font-extrabold tracking-tight block">
  <span on:click="{() => (getPosition = true)}" class="opacity-50 cursor-pointer hover:opacity-65 inline-block absolute top-3 right-5">
    <img src={crosshair} alt="crosshair" style="fill: transparent; pointer-events: visible;" class="h-8 w-8" />
  </span>
  geo
  </h3>
  <VisSingleContainer data={$data}>
    <VisTopoJSONMap 
      topojson={WorldMapTopoJSON} 
      mapFitToPoints={true} 
      disableZoom={true}
      {pointLabel} 
      {pointLabelTextBrightnessRatio}
    />
  </VisSingleContainer>
</div>
<style>
</style>