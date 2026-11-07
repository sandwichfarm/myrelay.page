import { GeoCodedEvent } from './geocoded';
import type { UserProfile } from '../MRPUser';

export class RelayMonitor extends GeoCodedEvent {
  profile?: UserProfile;
  get operator() { return this.tagValue('o'); }
}
