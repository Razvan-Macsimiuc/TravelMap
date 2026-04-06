import { Injectable } from '@angular/core';
import type mapboxgl from 'mapbox-gl';

/**
 * Holds the live Mapbox `Map` from `MapPage` so other routes (e.g. Settings travel reel)
 * can pass it to `TravelReelComponent` for the real globe intro.
 */
@Injectable({ providedIn: 'root' })
export class MapInstanceBridgeService {
  private map: mapboxgl.Map | null = null;

  registerMap(map: mapboxgl.Map | null): void {
    this.map = map;
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }
}
