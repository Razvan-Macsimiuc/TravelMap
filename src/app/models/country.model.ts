export interface Country {
  code: string;      // ISO 3166-1 alpha-2 code
  name: string;
  visited: boolean;
  photoIds: string[];
  visitCount?: number;   // Number of times visited
  daysStayed?: number;   // Total days stayed in the country
  cities?: string[];     // List of cities visited in this country
  cityCoordinates?: Record<string, [number, number]>; // cityName → [lng, lat]
  note?: string;         // Personal note (max 120 characters)
}
