import { NDKKind } from "@nostr-dev-kit/ndk";
import type NDK from "@nostr-dev-kit/ndk";
import type { NDKEvent, NostrEvent } from "@nostr-dev-kit/ndk";
import { NDKEventGeoCoded } from "./geocoded.js";

export enum RelayDiscoveryTags {
    network = "n",
    nip = "N",
    restrictions = "R",
    software = "s",
    kind = "k",
    geo = "g"
}

export type RelayDiscoveryFilters = {
    [K in RelayDiscoveryTags as `#${K}`]?: string[];
};

/**
 * A `Relay Discovery` event is used for discovering relays via filters.
 * 
 * @author sandwich.farm
 * @summary Relay Discovery
 * @description 
 * @implements kind:30166
 * @example 
 * ```typescript
 * let $event = new RelayDiscovery(ndk, rawEvent);
 * $event.network = "clearnet";
 * $event.nips = [0,1,2,3,4,5,6,7,8,9,10,11];
 * $event.restrictions = ["!auth", "!payment"];
 * $event.software = "git+";
 * 
 * ////console.log($event.rawEvent());
 * 
 * ////console.log($event.nips)
 * ```
 */
export class RelayDiscovery extends NDKEventGeoCoded {
    constructor(ndk: NDK | undefined, rawEvent?: NostrEvent) {
        super(ndk, rawEvent);
        this.kind ??= 30166; 
    }

    static from(event: NDKEvent): RelayDiscovery {
        return new RelayDiscovery(event.ndk, event.rawEvent());
    }

    get rttOpen(): number | undefined {
        const rtt = this.tags.find(tag => tag[0] === 'rtt-open')?.[1]
        if(!rtt) return
        return parseInt(rtt);
    }

    get rttRead(): number | undefined {
        const rtt = this.tags.find(tag => tag[0] === 'rtt-read')?.[1]
        if(!rtt) return
        return parseInt(rtt);
    }

    get rttWrite(): number | undefined {
        const rtt = this.tags.find(tag => tag[0] === 'rtt-write')?.[1]
        if(!rtt) return
        return parseInt(rtt);
    }

    get url(): string | undefined { 
        return this.tagValue("d");
    }

    set url(value: string | undefined) {
        this.removeTag("d");
        if (value) {
            this.tags.push(["d", value]);
        }
    }

    get network(): string | undefined {
        return this.tagValue("n");
    }

    set network( value: string | undefined ) {
        this.removeTag("n");
        if (value) {
            this.tags.push(["n", value]);
        }
    }

    get nips(): number[] {
        return this.tags.filter(tag => tag[0] === "N").map(tag => parseInt(tag[1]));
    }

    set nips( values: number[] ) {
        this.removeTag("N");
        values.forEach(value => {
            this.tags.push(["N", String(value)]);
        });
    }

    get restrictions(): string[] {
        return this.tags.filter(tag => tag[0] === "R").map(tag => tag[1]);
    }

    set restrictions( values: string[] ) {
        this.removeTag("R");
        values.forEach(value => {
            this.tags.push(["R", value]);
        });
    }

    get software(): string | undefined {
        return this.tagValue("s");
    }

    set software( value: string | undefined ) {
        this.removeTag("s");
        if (value) {
            this.tags.push(["s", value]);
        }
    }
}