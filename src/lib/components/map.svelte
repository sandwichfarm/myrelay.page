<script lang="ts">
  import { VisSingleContainer, VisTopoJSONMap } from '@unovis/svelte'
  import { WorldMapTopoJSON } from '@unovis/ts/maps'
  import type { MapData, MapPoint, MapLink } from '@unovis/ts'
  import { NDKEventGeoCoded } from '$lib/core/geocoded'
  import type {DD} from '$lib/core/geocoded'

  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  
  import { Badge } from "$lib/components/ui/badge/index.js";

  const mrp_context = getContext(MY_RELAY_PAGE);

  let dd: DD = { lat: 0, lon: 0 }
  let data: MapData

  mrp_context.subscribe((_mrp) => {
    dd = _mrp.dd
    if(!dd?.lat || !dd?.lon) return 
    const relayMapPoint: MapPoint = { latitude: dd.lat, longitude: dd.lon, label: _mrp.url}
    const monitorMapPoints: MapPoint[] = []
    const monitorLinks: MapLink[] = []
    const monitors = _mrp.ndk.monitors.monitorEvents
    for ( const monitor of monitors) {
      const dd = monitor.dd
      const point: MapPoint = { id: monitor.geohash, latitude: dd.lat, longitude: dd.lon, color: 'gray', label: undefined, radius: 3 }
      const link: MapLink = { source: relayMapPoint, target: point, color: 'green', width: 3 } 
      monitorMapPoints.push(point)
      monitorLinks.push(link)
    }
    data = {
      areas: [/* array of AreaDatum */],
      points: [relayMapPoint, ...monitorMapPoints],
      links: monitorLinks
    };
  });
  const pointLabel = (d: MapPoint) => d.label
  // const pointLabelPosition = (d: MapPoint) => d.position || 'Bottom'
</script>
<div class="bg-gradient-to-b from-gray-100 to-white mt-10 pt-0 h-80  pb-5 px-5 rounded-lg relative">
  <h3 class="py-5 absolute top w-full mb-2 text-gray-600 scroll-m-20 text-xl font-extrabold tracking-tight mb-2 block w-full">
  geo
  </h3>
  <VisSingleContainer {data}>
    <VisTopoJSONMap 
      mapFitToPoints={true} 
      topojson={WorldMapTopoJSON} 
      {pointLabel} 
    />
  </VisSingleContainer>
</div>
<style>
</style>