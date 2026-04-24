/** Bundled travel copy for country detail (matches `assets/data/country-insights.json`). */
export interface CountryInsightsBundle {
  atAGlance: string;
  whyVisit: string;
  tasteAndTraditions: string;
  planSmart: string;
  /** When true, country detail shows the Wikipedia / CC-BY-SA footer. Omitted or false for `travel.json`-sourced bundles. */
  wikipediaAttribution?: boolean;
}

export type CountryInsights = CountryInsightsBundle;
