<script lang="ts">
  import { VisSingleContainer, VisTopoJSONMap } from '@unovis/svelte'
  import type { ColorAccessor } from '@unovis/svelte'

  import { WorldMapTopoJSON } from '@unovis/ts/maps'
  
  import { MapPointLabelPosition, type MapData, type MapLink } from '@unovis/ts'
  import type {DD} from '$lib/core/kinds/geocoded'

  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import Geolocation from 'svelte-geolocation'
  import { writable } from 'svelte/store';
  import type {Writable} from 'svelte/store'  
  import type { MyRelayPage } from '$lib/core/MRP';

  import crosshair from '$lib/assets/images/crosshair.svg';
  import Block from '$lib/components/wrappers/block.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import Monitors from '../monitors/monitors.svelte';

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

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  let dd: DD | undefined = { lat: 0, lon: 0 }
  let data: Writable<MapData<MapArea, MapPoint, MapLink>> = writable({ areas: [] as MapArea[], points: [] as MapPoint[], links: [] as MapLink[] })
  let relayMapPoint: MapPoint;

  export let key: string = ""

  MRP.subscribe((_mrp) => {
    dd = _mrp.dd 
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
    const monitors = _mrp.nostr?.monitors?.all
    for ( const monitor of monitors) {
      const dd = monitor.dd
      const rtt =  _mrp.nostr?.monitors?.metaEventsFor(monitor.pubkey)?.[0].rtt?.open || undefined
      
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
  }

  const pointLabel = (d: MapPoint) => d?.label
  const pointLabelPosition = (d: MapPoint): MapPointLabelPosition => d.position || MapPointLabelPosition.Bottom
  const pointLabelTextBrightnessRatio = (d: MapPoint): number => d.brightness || 0.90
  const linkColor = (d: MapLink): ColorAccessor<LinkDatum> => {
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
{#if $MRP.nostr.monitors.isComplete}
<Block class="relative pt-0" headingClass="py-5 absolute top w-full mb-2" {key}>
  <svelte:fragment slot="title">
    geo
  </svelte:fragment>
  <svelte:fragment slot="content">
    <VisSingleContainer data={$data} class="mrp-map-light dark:mrp-map-dark">
      <VisTopoJSONMap 
        topojson={WorldMapTopoJSON} 
        mapFitToPoints={true} 
        disableZoom={true}
        {pointLabel} 
        {pointLabelTextBrightnessRatio}
      />
    </VisSingleContainer>
    <Monitors />
  </svelte:fragment>
</Block>
{/if}
<style>
</style>