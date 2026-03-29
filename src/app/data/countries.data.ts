import { Country } from '../models/country.model';

/**
 * Complete list of 195 UN-recognized sovereign countries.
 * ISO 3166-1 alpha-2 codes matching the GeoJSON data.
 */
export const ALL_COUNTRIES: Country[] = [
  // ============================================
  // AFRICA (54 countries)
  // ============================================
  { code: 'DZ', name: 'Algeria', visited: false, photoIds: [] },
  { code: 'AO', name: 'Angola', visited: false, photoIds: [] },
  { code: 'BJ', name: 'Benin', visited: false, photoIds: [] },
  { code: 'BW', name: 'Botswana', visited: false, photoIds: [] },
  { code: 'BF', name: 'Burkina Faso', visited: false, photoIds: [] },
  { code: 'BI', name: 'Burundi', visited: false, photoIds: [] },
  { code: 'CV', name: 'Cabo Verde', visited: false, photoIds: [] },
  { code: 'CM', name: 'Cameroon', visited: false, photoIds: [] },
  { code: 'CF', name: 'Central African Republic', visited: false, photoIds: [] },
  { code: 'TD', name: 'Chad', visited: false, photoIds: [] },
  { code: 'KM', name: 'Comoros', visited: false, photoIds: [] },
  { code: 'CG', name: 'Republic of the Congo', visited: false, photoIds: [] },
  { code: 'CD', name: 'Democratic Republic of the Congo', visited: false, photoIds: [] },
  { code: 'CI', name: "Côte d'Ivoire", visited: false, photoIds: [] },
  { code: 'DJ', name: 'Djibouti', visited: false, photoIds: [] },
  { code: 'EG', name: 'Egypt', visited: false, photoIds: [] },
  { code: 'GQ', name: 'Equatorial Guinea', visited: false, photoIds: [] },
  { code: 'ER', name: 'Eritrea', visited: false, photoIds: [] },
  { code: 'SZ', name: 'Eswatini', visited: false, photoIds: [] },
  { code: 'ET', name: 'Ethiopia', visited: false, photoIds: [] },
  { code: 'GA', name: 'Gabon', visited: false, photoIds: [] },
  { code: 'GM', name: 'Gambia', visited: false, photoIds: [] },
  { code: 'GH', name: 'Ghana', visited: false, photoIds: [] },
  { code: 'GN', name: 'Guinea', visited: false, photoIds: [] },
  { code: 'GW', name: 'Guinea-Bissau', visited: false, photoIds: [] },
  { code: 'KE', name: 'Kenya', visited: false, photoIds: [] },
  { code: 'LS', name: 'Lesotho', visited: false, photoIds: [] },
  { code: 'LR', name: 'Liberia', visited: false, photoIds: [] },
  { code: 'LY', name: 'Libya', visited: false, photoIds: [] },
  { code: 'MG', name: 'Madagascar', visited: false, photoIds: [] },
  { code: 'MW', name: 'Malawi', visited: false, photoIds: [] },
  { code: 'ML', name: 'Mali', visited: false, photoIds: [] },
  { code: 'MR', name: 'Mauritania', visited: false, photoIds: [] },
  { code: 'MU', name: 'Mauritius', visited: false, photoIds: [] },
  { code: 'MA', name: 'Morocco', visited: false, photoIds: [] },
  { code: 'MZ', name: 'Mozambique', visited: false, photoIds: [] },
  { code: 'NA', name: 'Namibia', visited: false, photoIds: [] },
  { code: 'NE', name: 'Niger', visited: false, photoIds: [] },
  { code: 'NG', name: 'Nigeria', visited: false, photoIds: [] },
  { code: 'RW', name: 'Rwanda', visited: false, photoIds: [] },
  { code: 'ST', name: 'São Tomé and Príncipe', visited: false, photoIds: [] },
  { code: 'SN', name: 'Senegal', visited: false, photoIds: [] },
  { code: 'SC', name: 'Seychelles', visited: false, photoIds: [] },
  { code: 'SL', name: 'Sierra Leone', visited: false, photoIds: [] },
  { code: 'SO', name: 'Somalia', visited: false, photoIds: [] },
  { code: 'ZA', name: 'South Africa', visited: false, photoIds: [] },
  { code: 'SS', name: 'South Sudan', visited: false, photoIds: [] },
  { code: 'SD', name: 'Sudan', visited: false, photoIds: [] },
  { code: 'TZ', name: 'Tanzania', visited: false, photoIds: [] },
  { code: 'TG', name: 'Togo', visited: false, photoIds: [] },
  { code: 'TN', name: 'Tunisia', visited: false, photoIds: [] },
  { code: 'UG', name: 'Uganda', visited: false, photoIds: [] },
  { code: 'ZM', name: 'Zambia', visited: false, photoIds: [] },
  { code: 'ZW', name: 'Zimbabwe', visited: false, photoIds: [] },

  // ============================================
  // AMERICAS (35 countries)
  // ============================================
  { code: 'AG', name: 'Antigua and Barbuda', visited: false, photoIds: [] },
  { code: 'AR', name: 'Argentina', visited: false, photoIds: [] },
  { code: 'BS', name: 'Bahamas', visited: false, photoIds: [] },
  { code: 'BB', name: 'Barbados', visited: false, photoIds: [] },
  { code: 'BZ', name: 'Belize', visited: false, photoIds: [] },
  { code: 'BO', name: 'Bolivia', visited: false, photoIds: [] },
  { code: 'BR', name: 'Brazil', visited: false, photoIds: [] },
  { code: 'CA', name: 'Canada', visited: false, photoIds: [] },
  { code: 'CL', name: 'Chile', visited: false, photoIds: [] },
  { code: 'CO', name: 'Colombia', visited: false, photoIds: [] },
  { code: 'CR', name: 'Costa Rica', visited: false, photoIds: [] },
  { code: 'CU', name: 'Cuba', visited: false, photoIds: [] },
  { code: 'DM', name: 'Dominica', visited: false, photoIds: [] },
  { code: 'DO', name: 'Dominican Republic', visited: false, photoIds: [] },
  { code: 'EC', name: 'Ecuador', visited: false, photoIds: [] },
  { code: 'SV', name: 'El Salvador', visited: false, photoIds: [] },
  { code: 'GD', name: 'Grenada', visited: false, photoIds: [] },
  { code: 'GT', name: 'Guatemala', visited: false, photoIds: [] },
  { code: 'GY', name: 'Guyana', visited: false, photoIds: [] },
  { code: 'HT', name: 'Haiti', visited: false, photoIds: [] },
  { code: 'HN', name: 'Honduras', visited: false, photoIds: [] },
  { code: 'JM', name: 'Jamaica', visited: false, photoIds: [] },
  { code: 'MX', name: 'Mexico', visited: false, photoIds: [] },
  { code: 'NI', name: 'Nicaragua', visited: false, photoIds: [] },
  { code: 'PA', name: 'Panama', visited: false, photoIds: [] },
  { code: 'PY', name: 'Paraguay', visited: false, photoIds: [] },
  { code: 'PE', name: 'Peru', visited: false, photoIds: [] },
  { code: 'KN', name: 'Saint Kitts and Nevis', visited: false, photoIds: [] },
  { code: 'LC', name: 'Saint Lucia', visited: false, photoIds: [] },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', visited: false, photoIds: [] },
  { code: 'SR', name: 'Suriname', visited: false, photoIds: [] },
  { code: 'TT', name: 'Trinidad and Tobago', visited: false, photoIds: [] },
  { code: 'US', name: 'United States', visited: false, photoIds: [] },
  { code: 'UY', name: 'Uruguay', visited: false, photoIds: [] },
  { code: 'VE', name: 'Venezuela', visited: false, photoIds: [] },

  // ============================================
  // ASIA (48 countries)
  // ============================================
  { code: 'AF', name: 'Afghanistan', visited: false, photoIds: [] },
  { code: 'AM', name: 'Armenia', visited: false, photoIds: [] },
  { code: 'AZ', name: 'Azerbaijan', visited: false, photoIds: [] },
  { code: 'BH', name: 'Bahrain', visited: false, photoIds: [] },
  { code: 'BD', name: 'Bangladesh', visited: false, photoIds: [] },
  { code: 'BT', name: 'Bhutan', visited: false, photoIds: [] },
  { code: 'BN', name: 'Brunei', visited: false, photoIds: [] },
  { code: 'KH', name: 'Cambodia', visited: false, photoIds: [] },
  { code: 'CN', name: 'China', visited: false, photoIds: [] },
  { code: 'CY', name: 'Cyprus', visited: false, photoIds: [] },
  { code: 'GE', name: 'Georgia', visited: false, photoIds: [] },
  { code: 'IN', name: 'India', visited: false, photoIds: [] },
  { code: 'ID', name: 'Indonesia', visited: false, photoIds: [] },
  { code: 'IR', name: 'Iran', visited: false, photoIds: [] },
  { code: 'IQ', name: 'Iraq', visited: false, photoIds: [] },
  { code: 'IL', name: 'Israel', visited: false, photoIds: [] },
  { code: 'JP', name: 'Japan', visited: false, photoIds: [] },
  { code: 'JO', name: 'Jordan', visited: false, photoIds: [] },
  { code: 'KZ', name: 'Kazakhstan', visited: false, photoIds: [] },
  { code: 'KW', name: 'Kuwait', visited: false, photoIds: [] },
  { code: 'KG', name: 'Kyrgyzstan', visited: false, photoIds: [] },
  { code: 'LA', name: 'Laos', visited: false, photoIds: [] },
  { code: 'LB', name: 'Lebanon', visited: false, photoIds: [] },
  { code: 'MY', name: 'Malaysia', visited: false, photoIds: [] },
  { code: 'MV', name: 'Maldives', visited: false, photoIds: [] },
  { code: 'MN', name: 'Mongolia', visited: false, photoIds: [] },
  { code: 'MM', name: 'Myanmar', visited: false, photoIds: [] },
  { code: 'NP', name: 'Nepal', visited: false, photoIds: [] },
  { code: 'KP', name: 'North Korea', visited: false, photoIds: [] },
  { code: 'OM', name: 'Oman', visited: false, photoIds: [] },
  { code: 'PK', name: 'Pakistan', visited: false, photoIds: [] },
  { code: 'PS', name: 'Palestine', visited: false, photoIds: [] },
  { code: 'PH', name: 'Philippines', visited: false, photoIds: [] },
  { code: 'QA', name: 'Qatar', visited: false, photoIds: [] },
  { code: 'SA', name: 'Saudi Arabia', visited: false, photoIds: [] },
  { code: 'SG', name: 'Singapore', visited: false, photoIds: [] },
  { code: 'KR', name: 'South Korea', visited: false, photoIds: [] },
  { code: 'LK', name: 'Sri Lanka', visited: false, photoIds: [] },
  { code: 'SY', name: 'Syria', visited: false, photoIds: [] },
  { code: 'TW', name: 'Taiwan', visited: false, photoIds: [] },
  { code: 'TJ', name: 'Tajikistan', visited: false, photoIds: [] },
  { code: 'TH', name: 'Thailand', visited: false, photoIds: [] },
  { code: 'TL', name: 'Timor-Leste', visited: false, photoIds: [] },
  { code: 'TR', name: 'Turkey', visited: false, photoIds: [] },
  { code: 'TM', name: 'Turkmenistan', visited: false, photoIds: [] },
  { code: 'AE', name: 'United Arab Emirates', visited: false, photoIds: [] },
  { code: 'UZ', name: 'Uzbekistan', visited: false, photoIds: [] },
  { code: 'VN', name: 'Vietnam', visited: false, photoIds: [] },
  { code: 'YE', name: 'Yemen', visited: false, photoIds: [] },

  // ============================================
  // EUROPE (44 countries)
  // ============================================
  { code: 'AL', name: 'Albania', visited: false, photoIds: [] },
  { code: 'AD', name: 'Andorra', visited: false, photoIds: [] },
  { code: 'AT', name: 'Austria', visited: false, photoIds: [] },
  { code: 'BY', name: 'Belarus', visited: false, photoIds: [] },
  { code: 'BE', name: 'Belgium', visited: false, photoIds: [] },
  { code: 'BA', name: 'Bosnia and Herzegovina', visited: false, photoIds: [] },
  { code: 'BG', name: 'Bulgaria', visited: false, photoIds: [] },
  { code: 'HR', name: 'Croatia', visited: false, photoIds: [] },
  { code: 'CZ', name: 'Czech Republic', visited: false, photoIds: [] },
  { code: 'DK', name: 'Denmark', visited: false, photoIds: [] },
  { code: 'EE', name: 'Estonia', visited: false, photoIds: [] },
  { code: 'FI', name: 'Finland', visited: false, photoIds: [] },
  { code: 'FR', name: 'France', visited: false, photoIds: [] },
  { code: 'DE', name: 'Germany', visited: false, photoIds: [] },
  { code: 'GR', name: 'Greece', visited: false, photoIds: [] },
  { code: 'HU', name: 'Hungary', visited: false, photoIds: [] },
  { code: 'IS', name: 'Iceland', visited: false, photoIds: [] },
  { code: 'IE', name: 'Ireland', visited: false, photoIds: [] },
  { code: 'IT', name: 'Italy', visited: false, photoIds: [] },
  { code: 'XK', name: 'Kosovo', visited: false, photoIds: [] },
  { code: 'LV', name: 'Latvia', visited: false, photoIds: [] },
  { code: 'LI', name: 'Liechtenstein', visited: false, photoIds: [] },
  { code: 'LT', name: 'Lithuania', visited: false, photoIds: [] },
  { code: 'LU', name: 'Luxembourg', visited: false, photoIds: [] },
  { code: 'MT', name: 'Malta', visited: false, photoIds: [] },
  { code: 'MD', name: 'Moldova', visited: false, photoIds: [] },
  { code: 'MC', name: 'Monaco', visited: false, photoIds: [] },
  { code: 'ME', name: 'Montenegro', visited: false, photoIds: [] },
  { code: 'NL', name: 'Netherlands', visited: false, photoIds: [] },
  { code: 'MK', name: 'North Macedonia', visited: false, photoIds: [] },
  { code: 'NO', name: 'Norway', visited: false, photoIds: [] },
  { code: 'PL', name: 'Poland', visited: false, photoIds: [] },
  { code: 'PT', name: 'Portugal', visited: false, photoIds: [] },
  { code: 'RO', name: 'Romania', visited: false, photoIds: [] },
  { code: 'RU', name: 'Russia', visited: false, photoIds: [] },
  { code: 'SM', name: 'San Marino', visited: false, photoIds: [] },
  { code: 'RS', name: 'Serbia', visited: false, photoIds: [] },
  { code: 'SK', name: 'Slovakia', visited: false, photoIds: [] },
  { code: 'SI', name: 'Slovenia', visited: false, photoIds: [] },
  { code: 'ES', name: 'Spain', visited: false, photoIds: [] },
  { code: 'SE', name: 'Sweden', visited: false, photoIds: [] },
  { code: 'CH', name: 'Switzerland', visited: false, photoIds: [] },
  { code: 'UA', name: 'Ukraine', visited: false, photoIds: [] },
  { code: 'GB', name: 'United Kingdom', visited: false, photoIds: [] },
  { code: 'VA', name: 'Vatican City', visited: false, photoIds: [] },

  // ============================================
  // OCEANIA (14 countries)
  // ============================================
  { code: 'AU', name: 'Australia', visited: false, photoIds: [] },
  { code: 'FJ', name: 'Fiji', visited: false, photoIds: [] },
  { code: 'KI', name: 'Kiribati', visited: false, photoIds: [] },
  { code: 'MH', name: 'Marshall Islands', visited: false, photoIds: [] },
  { code: 'FM', name: 'Micronesia', visited: false, photoIds: [] },
  { code: 'NR', name: 'Nauru', visited: false, photoIds: [] },
  { code: 'NZ', name: 'New Zealand', visited: false, photoIds: [] },
  { code: 'PW', name: 'Palau', visited: false, photoIds: [] },
  { code: 'PG', name: 'Papua New Guinea', visited: false, photoIds: [] },
  { code: 'WS', name: 'Samoa', visited: false, photoIds: [] },
  { code: 'SB', name: 'Solomon Islands', visited: false, photoIds: [] },
  { code: 'TO', name: 'Tonga', visited: false, photoIds: [] },
  { code: 'TV', name: 'Tuvalu', visited: false, photoIds: [] },
  { code: 'VU', name: 'Vanuatu', visited: false, photoIds: [] },
];

/**
 * Map of ISO codes to country names for quick lookup.
 */
export const COUNTRY_NAME_MAP: Map<string, string> = new Map(
  ALL_COUNTRIES.map((c) => [c.code, c.name])
);

/**
 * Get country name by ISO code.
 */
export function getCountryName(code: string): string {
  return COUNTRY_NAME_MAP.get(code.toUpperCase()) || code;
}

/**
 * Total count of UN-recognized countries.
 */
export const TOTAL_COUNTRIES = 195;




