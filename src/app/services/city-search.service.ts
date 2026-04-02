import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CityResult {
  name: string;            // e.g. "Paris"
  subtitle: string;        // e.g. "Île-de-France, France"
  coordinates: [number, number]; // [lng, lat]
}

interface MapboxFeature {
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat] from Mapbox geocoding
}

interface MapboxResponse {
  features: MapboxFeature[];
}

@Injectable({ providedIn: 'root' })
export class CitySearchService {
  private readonly http = inject(HttpClient);
  private readonly token = environment.mapboxToken;

  searchCities(query: string, countryCode: string): Observable<CityResult[]> {
    const trimmed = query.trim();
    if (!this.token || trimmed.length < 2) return of([]);

    const params = new HttpParams()
      .set('types', 'place')
      .set('country', countryCode.toLowerCase())
      .set('autocomplete', 'true')
      .set('limit', '6')
      .set('access_token', this.token);

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`;

    return this.http.get<MapboxResponse>(url, { params }).pipe(
      map((data) =>
        (data.features ?? []).map((feature) => {
          const name = feature.text ?? '';
          const subtitle = (feature.place_name ?? '')
            .replace(name + ', ', '')
            .replace(name, '')
            .trim();
          return { name, subtitle, coordinates: feature.center };
        })
      ),
      catchError(() => of([]))
    );
  }
}
