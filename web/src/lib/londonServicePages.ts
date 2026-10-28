/**
 * London service-specific landing pages.
 * Each entry generates a page at /locations/[areaSlug]/[serviceSlug]
 * covering delivery, parcel, pharmacy, and food services.
 *
 * 231 London areas × 4 services = 924 service pages
 * + 231 area hub pages
 * + 4 zone pages (central/north/east/west)
 * + 7 static routes
 * ──────────────────────────────────────────────
 * 1,166 total sitemap entries
 */

export type ServiceType = 'delivery' | 'parcel' | 'pharmacy' | 'food';

export interface LondonArea {
  slug: string;
  name: string;
  postcode: string;
  borough: string;
  region: 'central' | 'north' | 'south' | 'east' | 'west';
  lat: number;
  lng: number;
}

export interface ServicePageData {
  areaSlug: string;
  serviceSlug: ServiceType;
  title: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  keyPoints: string[];
}

// ─── 100 London Areas ────────────────────────────────────────────────────────

export const LONDON_AREAS: LondonArea[] = [
  // Central
  { slug: 'city-of-london',      name: 'City of London',      postcode: 'EC2',  borough: 'City of London',          region: 'central', lat: 51.5155, lng: -0.0922 },
  { slug: 'westminster',         name: 'Westminster',          postcode: 'SW1',  borough: 'Westminster',              region: 'central', lat: 51.4973, lng: -0.1372 },
  { slug: 'mayfair',             name: 'Mayfair',              postcode: 'W1',   borough: 'Westminster',              region: 'central', lat: 51.5118, lng: -0.1489 },
  { slug: 'soho',                name: 'Soho',                 postcode: 'W1',   borough: 'Westminster',              region: 'central', lat: 51.5130, lng: -0.1350 },
  { slug: 'covent-garden',       name: 'Covent Garden',        postcode: 'WC2',  borough: 'Westminster',              region: 'central', lat: 51.5117, lng: -0.1240 },
  { slug: 'holborn',             name: 'Holborn',              postcode: 'WC1',  borough: 'Camden',                   region: 'central', lat: 51.5180, lng: -0.1190 },
  { slug: 'clerkenwell',         name: 'Clerkenwell',          postcode: 'EC1',  borough: 'Islington',                region: 'central', lat: 51.5236, lng: -0.1037 },
  { slug: 'farringdon',          name: 'Farringdon',           postcode: 'EC1',  borough: 'Islington',                region: 'central', lat: 51.5203, lng: -0.1049 },
  { slug: 'barbican',            name: 'Barbican',             postcode: 'EC2',  borough: 'City of London',          region: 'central', lat: 51.5200, lng: -0.0936 },
  { slug: 'fitzrovia',           name: 'Fitzrovia',            postcode: 'W1T',  borough: 'Westminster',              region: 'central', lat: 51.5193, lng: -0.1389 },
  { slug: 'bloomsbury',          name: 'Bloomsbury',           postcode: 'WC1',  borough: 'Camden',                   region: 'central', lat: 51.5218, lng: -0.1240 },
  { slug: 'marylebone',          name: 'Marylebone',           postcode: 'W1U',  borough: 'Westminster',              region: 'central', lat: 51.5215, lng: -0.1534 },
  { slug: 'paddington',          name: 'Paddington',           postcode: 'W2',   borough: 'Westminster',              region: 'central', lat: 51.5154, lng: -0.1755 },
  { slug: 'victoria',            name: 'Victoria',             postcode: 'SW1V', borough: 'Westminster',              region: 'central', lat: 51.4965, lng: -0.1447 },
  { slug: 'lambeth-north',       name: 'Lambeth North',        postcode: 'SE1',  borough: 'Lambeth',                  region: 'central', lat: 51.5012, lng: -0.1135 },
  // North
  { slug: 'camden-town',         name: 'Camden Town',          postcode: 'NW1',  borough: 'Camden',                   region: 'north', lat: 51.5390, lng: -0.1426 },
  { slug: 'islington',           name: 'Islington',            postcode: 'N1',   borough: 'Islington',                region: 'north', lat: 51.5362, lng: -0.1033 },
  { slug: 'angel',               name: 'Angel',                postcode: 'N1',   borough: 'Islington',                region: 'north', lat: 51.5322, lng: -0.1058 },
  { slug: 'highbury',            name: 'Highbury',             postcode: 'N5',   borough: 'Islington',                region: 'north', lat: 51.5554, lng: -0.0985 },
  { slug: 'holloway',            name: 'Holloway',             postcode: 'N7',   borough: 'Islington',                region: 'north', lat: 51.5536, lng: -0.1148 },
  { slug: 'finsbury-park',       name: 'Finsbury Park',        postcode: 'N4',   borough: 'Islington',                region: 'north', lat: 51.5643, lng: -0.1067 },
  { slug: 'hampstead',           name: 'Hampstead',            postcode: 'NW3',  borough: 'Camden',                   region: 'north', lat: 51.5566, lng: -0.1776 },
  { slug: 'kentish-town',        name: 'Kentish Town',         postcode: 'NW5',  borough: 'Camden',                   region: 'north', lat: 51.5501, lng: -0.1423 },
  { slug: 'kilburn',             name: 'Kilburn',              postcode: 'NW6',  borough: 'Brent',                    region: 'north', lat: 51.5471, lng: -0.2042 },
  { slug: 'st-johns-wood',       name: "St John's Wood",       postcode: 'NW8',  borough: 'Westminster',              region: 'north', lat: 51.5344, lng: -0.1720 },
  { slug: 'highgate',            name: 'Highgate',             postcode: 'N6',   borough: 'Camden',                   region: 'north', lat: 51.5716, lng: -0.1464 },
  { slug: 'muswell-hill',        name: 'Muswell Hill',         postcode: 'N10',  borough: 'Haringey',                 region: 'north', lat: 51.5895, lng: -0.1434 },
  { slug: 'wood-green',          name: 'Wood Green',           postcode: 'N22',  borough: 'Haringey',                 region: 'north', lat: 51.5974, lng: -0.1098 },
  { slug: 'tottenham',           name: 'Tottenham',            postcode: 'N17',  borough: 'Haringey',                 region: 'north', lat: 51.5881, lng: -0.0713 },
  { slug: 'palmers-green',       name: 'Palmers Green',        postcode: 'N13',  borough: 'Enfield',                  region: 'north', lat: 51.6166, lng: -0.1094 },
  { slug: 'finchley',            name: 'Finchley',             postcode: 'N3',   borough: 'Barnet',                   region: 'north', lat: 51.5997, lng: -0.1877 },
  { slug: 'hendon',              name: 'Hendon',               postcode: 'NW4',  borough: 'Barnet',                   region: 'north', lat: 51.5861, lng: -0.2266 },
  { slug: 'golders-green',       name: 'Golders Green',        postcode: 'NW11', borough: 'Barnet',                   region: 'north', lat: 51.5724, lng: -0.1944 },
  { slug: 'cricklewood',         name: 'Cricklewood',          postcode: 'NW2',  borough: 'Barnet',                   region: 'north', lat: 51.5584, lng: -0.2224 },
  // East
  { slug: 'shoreditch',          name: 'Shoreditch',           postcode: 'E1',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5246, lng: -0.0786 },
  { slug: 'hackney',             name: 'Hackney',              postcode: 'E8',   borough: 'Hackney',                  region: 'east', lat: 51.5476, lng: -0.0553 },
  { slug: 'bethnal-green',       name: 'Bethnal Green',        postcode: 'E2',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5271, lng: -0.0591 },
  { slug: 'stepney',             name: 'Stepney',              postcode: 'E1',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5130, lng: -0.0505 },
  { slug: 'whitechapel',         name: 'Whitechapel',          postcode: 'E1',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5189, lng: -0.0613 },
  { slug: 'mile-end',            name: 'Mile End',             postcode: 'E3',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5253, lng: -0.0334 },
  { slug: 'bow',                 name: 'Bow',                  postcode: 'E3',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5270, lng: -0.0217 },
  { slug: 'stratford',           name: 'Stratford',            postcode: 'E15',  borough: 'Newham',                   region: 'east', lat: 51.5419, lng: -0.0027 },
  { slug: 'canary-wharf',        name: 'Canary Wharf',         postcode: 'E14',  borough: 'Tower Hamlets',            region: 'east', lat: 51.5054, lng: -0.0235 },
  { slug: 'isle-of-dogs',        name: 'Isle of Dogs',         postcode: 'E14',  borough: 'Tower Hamlets',            region: 'east', lat: 51.4965, lng: -0.0120 },
  { slug: 'poplar',              name: 'Poplar',               postcode: 'E14',  borough: 'Tower Hamlets',            region: 'east', lat: 51.5090, lng: -0.0180 },
  { slug: 'wapping',             name: 'Wapping',              postcode: 'E1W',  borough: 'Tower Hamlets',            region: 'east', lat: 51.5063, lng: -0.0594 },
  { slug: 'dalston',             name: 'Dalston',              postcode: 'E8',   borough: 'Hackney',                  region: 'east', lat: 51.5454, lng: -0.0756 },
  { slug: 'clapton',             name: 'Clapton',              postcode: 'E5',   borough: 'Hackney',                  region: 'east', lat: 51.5551, lng: -0.0569 },
  { slug: 'stoke-newington',     name: 'Stoke Newington',      postcode: 'N16',  borough: 'Hackney',                  region: 'east', lat: 51.5626, lng: -0.0750 },
  { slug: 'leyton',              name: 'Leyton',               postcode: 'E10',  borough: 'Waltham Forest',           region: 'east', lat: 51.5566, lng: -0.0078 },
  { slug: 'walthamstow',         name: 'Walthamstow',          postcode: 'E17',  borough: 'Waltham Forest',           region: 'east', lat: 51.5826, lng: -0.0197 },
  { slug: 'forest-gate',         name: 'Forest Gate',          postcode: 'E7',   borough: 'Newham',                   region: 'east', lat: 51.5521, lng: 0.0263  },
  // South
  { slug: 'southwark',           name: 'Southwark',            postcode: 'SE1',  borough: 'Southwark',                region: 'south', lat: 51.5050, lng: -0.0887 },
  { slug: 'bermondsey',          name: 'Bermondsey',           postcode: 'SE1',  borough: 'Southwark',                region: 'south', lat: 51.4994, lng: -0.0750 },
  { slug: 'peckham',             name: 'Peckham',              postcode: 'SE15', borough: 'Southwark',                region: 'south', lat: 51.4742, lng: -0.0692 },
  { slug: 'brixton',             name: 'Brixton',              postcode: 'SW9',  borough: 'Lambeth',                  region: 'south', lat: 51.4613, lng: -0.1156 },
  { slug: 'clapham',             name: 'Clapham',              postcode: 'SW4',  borough: 'Lambeth',                  region: 'south', lat: 51.4617, lng: -0.1384 },
  { slug: 'stockwell',           name: 'Stockwell',            postcode: 'SW9',  borough: 'Lambeth',                  region: 'south', lat: 51.4713, lng: -0.1219 },
  { slug: 'streatham',           name: 'Streatham',            postcode: 'SW16', borough: 'Lambeth',                  region: 'south', lat: 51.4279, lng: -0.1265 },
  { slug: 'balham',              name: 'Balham',               postcode: 'SW12', borough: 'Wandsworth',               region: 'south', lat: 51.4432, lng: -0.1528 },
  { slug: 'tooting',             name: 'Tooting',              postcode: 'SW17', borough: 'Wandsworth',               region: 'south', lat: 51.4277, lng: -0.1677 },
  { slug: 'wandsworth',          name: 'Wandsworth',           postcode: 'SW18', borough: 'Wandsworth',               region: 'south', lat: 51.4567, lng: -0.1918 },
  { slug: 'battersea',           name: 'Battersea',            postcode: 'SW8',  borough: 'Wandsworth',               region: 'south', lat: 51.4779, lng: -0.1486 },
  { slug: 'camberwell',          name: 'Camberwell',           postcode: 'SE5',  borough: 'Southwark',                region: 'south', lat: 51.4720, lng: -0.0932 },
  { slug: 'dulwich',             name: 'Dulwich',              postcode: 'SE21', borough: 'Southwark',                region: 'south', lat: 51.4505, lng: -0.0875 },
  { slug: 'lewisham',            name: 'Lewisham',             postcode: 'SE13', borough: 'Lewisham',                 region: 'south', lat: 51.4611, lng: -0.0132 },
  { slug: 'greenwich',           name: 'Greenwich',            postcode: 'SE10', borough: 'Greenwich',                region: 'south', lat: 51.4779, lng: -0.0015 },
  { slug: 'deptford',            name: 'Deptford',             postcode: 'SE8',  borough: 'Lewisham',                 region: 'south', lat: 51.4778, lng: -0.0223 },
  { slug: 'new-cross',           name: 'New Cross',            postcode: 'SE14', borough: 'Lewisham',                 region: 'south', lat: 51.4757, lng: -0.0405 },
  { slug: 'crystal-palace',      name: 'Crystal Palace',       postcode: 'SE19', borough: 'Bromley',                  region: 'south', lat: 51.4196, lng: -0.0703 },
  { slug: 'croydon',             name: 'Croydon',              postcode: 'CR0',  borough: 'Croydon',                  region: 'south', lat: 51.3762, lng: -0.0982 },
  // West
  { slug: 'kensington',          name: 'Kensington',           postcode: 'W8',   borough: 'Kensington & Chelsea',     region: 'west', lat: 51.4994, lng: -0.1910 },
  { slug: 'chelsea',             name: 'Chelsea',              postcode: 'SW3',  borough: 'Kensington & Chelsea',     region: 'west', lat: 51.4882, lng: -0.1749 },
  { slug: 'notting-hill',        name: 'Notting Hill',         postcode: 'W11',  borough: 'Kensington & Chelsea',     region: 'west', lat: 51.5130, lng: -0.2057 },
  { slug: 'fulham',              name: 'Fulham',               postcode: 'SW6',  borough: 'Hammersmith & Fulham',     region: 'west', lat: 51.4804, lng: -0.1978 },
  { slug: 'hammersmith',         name: 'Hammersmith',          postcode: 'W6',   borough: 'Hammersmith & Fulham',     region: 'west', lat: 51.4927, lng: -0.2239 },
  { slug: 'shepherds-bush',      name: "Shepherd's Bush",      postcode: 'W12',  borough: 'Hammersmith & Fulham',     region: 'west', lat: 51.5049, lng: -0.2265 },
  { slug: 'chiswick',            name: 'Chiswick',             postcode: 'W4',   borough: 'Hounslow',                 region: 'west', lat: 51.4935, lng: -0.2680 },
  { slug: 'acton',               name: 'Acton',                postcode: 'W3',   borough: 'Ealing',                   region: 'west', lat: 51.5085, lng: -0.2726 },
  { slug: 'ealing',              name: 'Ealing',               postcode: 'W5',   borough: 'Ealing',                   region: 'west', lat: 51.5130, lng: -0.3089 },
  { slug: 'southall',            name: 'Southall',             postcode: 'UB1',  borough: 'Ealing',                   region: 'west', lat: 51.5069, lng: -0.3756 },
  { slug: 'brentford',           name: 'Brentford',            postcode: 'TW8',  borough: 'Hounslow',                 region: 'west', lat: 51.4893, lng: -0.3086 },
  { slug: 'hounslow',            name: 'Hounslow',             postcode: 'TW3',  borough: 'Hounslow',                 region: 'west', lat: 51.4668, lng: -0.3617 },
  { slug: 'richmond',            name: 'Richmond',             postcode: 'TW9',  borough: 'Richmond upon Thames',     region: 'west', lat: 51.4613, lng: -0.3037 },
  { slug: 'twickenham',          name: 'Twickenham',           postcode: 'TW1',  borough: 'Richmond upon Thames',     region: 'west', lat: 51.4447, lng: -0.3370 },
  { slug: 'putney',              name: 'Putney',               postcode: 'SW15', borough: 'Wandsworth',               region: 'west', lat: 51.4613, lng: -0.2160 },
  { slug: 'wimbledon',           name: 'Wimbledon',            postcode: 'SW19', borough: 'Merton',                   region: 'west', lat: 51.4214, lng: -0.2062 },
  { slug: 'kingston',            name: 'Kingston upon Thames', postcode: 'KT1',  borough: 'Kingston upon Thames',     region: 'west', lat: 51.4085, lng: -0.3064 },
  { slug: 'surbiton',            name: 'Surbiton',             postcode: 'KT6',  borough: 'Kingston upon Thames',     region: 'west', lat: 51.3931, lng: -0.3047 },
  { slug: 'west-kensington',     name: 'West Kensington',      postcode: 'W14',  borough: 'Hammersmith & Fulham',     region: 'west', lat: 51.4906, lng: -0.2064 },
  { slug: 'south-kensington',    name: 'South Kensington',     postcode: 'SW7',  borough: 'Kensington & Chelsea',     region: 'west', lat: 51.4941, lng: -0.1731 },
  { slug: 'earl-court',          name: "Earl's Court",         postcode: 'SW5',  borough: 'Kensington & Chelsea',     region: 'west', lat: 51.4915, lng: -0.1930 },
  { slug: 'barnes',              name: 'Barnes',               postcode: 'SW13', borough: 'Richmond upon Thames',     region: 'west', lat: 51.4720, lng: -0.2461 },
  { slug: 'mortlake',            name: 'Mortlake',             postcode: 'SW14', borough: 'Richmond upon Thames',     region: 'west', lat: 51.4693, lng: -0.2680 },

  // ── Additional Central / Inner London areas ────────────────────────────────
  { slug: 'pimlico',             name: 'Pimlico',              postcode: 'SW1V', borough: 'Westminster',              region: 'central', lat: 51.4896, lng: -0.1352 },
  { slug: 'aldgate',             name: 'Aldgate',              postcode: 'EC3',  borough: 'City of London',          region: 'central', lat: 51.5136, lng: -0.0786 },
  { slug: 'moorgate',            name: 'Moorgate',             postcode: 'EC2',  borough: 'City of London',          region: 'central', lat: 51.5185, lng: -0.0885 },
  { slug: 'blackfriars',        name: 'Blackfriars',          postcode: 'EC4',  borough: 'City of London',          region: 'central', lat: 51.5121, lng: -0.1035 },
  { slug: 'temple',             name: 'Temple',               postcode: 'WC2',  borough: 'City of London',          region: 'central', lat: 51.5113, lng: -0.1135 },
  { slug: 'southbank',          name: 'South Bank',           postcode: 'SE1',  borough: 'Lambeth',                  region: 'central', lat: 51.5074, lng: -0.1159 },
  { slug: 'borough',            name: 'Borough',              postcode: 'SE1',  borough: 'Southwark',                region: 'central', lat: 51.5014, lng: -0.0943 },
  { slug: 'elephant-castle',    name: 'Elephant & Castle',    postcode: 'SE1',  borough: 'Southwark',                region: 'central', lat: 51.4956, lng: -0.1007 },
  { slug: 'kennington',         name: 'Kennington',           postcode: 'SE11', borough: 'Lambeth',                  region: 'central', lat: 51.4880, lng: -0.1076 },
  { slug: 'oval',               name: 'Oval',                 postcode: 'SW8',  borough: 'Lambeth',                  region: 'central', lat: 51.4819, lng: -0.1139 },
  { slug: 'vauxhall',           name: 'Vauxhall',             postcode: 'SE11', borough: 'Lambeth',                  region: 'central', lat: 51.4852, lng: -0.1225 },

  // ── Additional North London areas ─────────────────────────────────────────
  { slug: 'archway',            name: 'Archway',              postcode: 'N19',  borough: 'Islington',                region: 'north', lat: 51.5654, lng: -0.1347 },
  { slug: 'tufnell-park',       name: 'Tufnell Park',         postcode: 'N7',   borough: 'Islington',                region: 'north', lat: 51.5560, lng: -0.1357 },
  { slug: 'crouch-end',         name: 'Crouch End',           postcode: 'N8',   borough: 'Haringey',                 region: 'north', lat: 51.5769, lng: -0.1232 },
  { slug: 'hornsey',            name: 'Hornsey',              postcode: 'N8',   borough: 'Haringey',                 region: 'north', lat: 51.5831, lng: -0.1218 },
  { slug: 'bounds-green',       name: 'Bounds Green',         postcode: 'N11',  borough: 'Haringey',                 region: 'north', lat: 51.5993, lng: -0.1303 },
  { slug: 'new-southgate',      name: 'New Southgate',        postcode: 'N11',  borough: 'Barnet',                   region: 'north', lat: 51.6055, lng: -0.1403 },
  { slug: 'friern-barnet',      name: 'Friern Barnet',        postcode: 'N11',  borough: 'Barnet',                   region: 'north', lat: 51.6108, lng: -0.1660 },
  { slug: 'east-barnet',        name: 'East Barnet',          postcode: 'EN4',  borough: 'Barnet',                   region: 'north', lat: 51.6443, lng: -0.1617 },
  { slug: 'new-barnet',         name: 'New Barnet',           postcode: 'EN5',  borough: 'Barnet',                   region: 'north', lat: 51.6533, lng: -0.1798 },
  { slug: 'barnet',             name: 'Barnet',               postcode: 'EN5',  borough: 'Barnet',                   region: 'north', lat: 51.6522, lng: -0.2015 },
  { slug: 'mill-hill',          name: 'Mill Hill',            postcode: 'NW7',  borough: 'Barnet',                   region: 'north', lat: 51.6151, lng: -0.2449 },
  { slug: 'edgware',            name: 'Edgware',              postcode: 'HA8',  borough: 'Barnet',                   region: 'north', lat: 51.6140, lng: -0.2748 },
  { slug: 'stanmore',           name: 'Stanmore',             postcode: 'HA7',  borough: 'Harrow',                   region: 'north', lat: 51.6202, lng: -0.3035 },
  { slug: 'harrow',             name: 'Harrow',               postcode: 'HA1',  borough: 'Harrow',                   region: 'north', lat: 51.5793, lng: -0.3327 },
  { slug: 'wembley',            name: 'Wembley',              postcode: 'HA9',  borough: 'Brent',                    region: 'north', lat: 51.5536, lng: -0.2970 },
  { slug: 'kingsbury',          name: 'Kingsbury',            postcode: 'NW9',  borough: 'Brent',                    region: 'north', lat: 51.5831, lng: -0.2612 },
  { slug: 'neasden',            name: 'Neasden',              postcode: 'NW10', borough: 'Brent',                    region: 'north', lat: 51.5525, lng: -0.2483 },
  { slug: 'harlesden',          name: 'Harlesden',            postcode: 'NW10', borough: 'Brent',                    region: 'north', lat: 51.5364, lng: -0.2593 },
  { slug: 'willesden',          name: 'Willesden',            postcode: 'NW10', borough: 'Brent',                    region: 'north', lat: 51.5467, lng: -0.2316 },
  { slug: 'colindale',          name: 'Colindale',            postcode: 'NW9',  borough: 'Barnet',                   region: 'north', lat: 51.5955, lng: -0.2527 },
  { slug: 'queensbury',         name: 'Queensbury',           postcode: 'HA8',  borough: 'Harrow',                   region: 'north', lat: 51.5933, lng: -0.2868 },
  { slug: 'burnt-oak',          name: 'Burnt Oak',            postcode: 'HA8',  borough: 'Barnet',                   region: 'north', lat: 51.6077, lng: -0.2646 },
  { slug: 'enfield',            name: 'Enfield',              postcode: 'EN1',  borough: 'Enfield',                  region: 'north', lat: 51.6529, lng: -0.0799 },
  { slug: 'edmonton',           name: 'Edmonton',             postcode: 'N18',  borough: 'Enfield',                  region: 'north', lat: 51.6181, lng: -0.0576 },
  { slug: 'winchmore-hill',     name: 'Winchmore Hill',       postcode: 'N21',  borough: 'Enfield',                  region: 'north', lat: 51.6349, lng: -0.1004 },
  { slug: 'southgate',          name: 'Southgate',            postcode: 'N14',  borough: 'Enfield',                  region: 'north', lat: 51.6326, lng: -0.1273 },

  // ── Additional East London areas ──────────────────────────────────────────
  { slug: 'hackney-wick',       name: 'Hackney Wick',         postcode: 'E9',   borough: 'Hackney',                  region: 'east', lat: 51.5424, lng: -0.0230 },
  { slug: 'homerton',           name: 'Homerton',             postcode: 'E9',   borough: 'Hackney',                  region: 'east', lat: 51.5498, lng: -0.0446 },
  { slug: 'victoria-park',      name: 'Victoria Park',        postcode: 'E3',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5338, lng: -0.0386 },
  { slug: 'globe-town',         name: 'Globe Town',           postcode: 'E2',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5264, lng: -0.0520 },
  { slug: 'shadwell',           name: 'Shadwell',             postcode: 'E1',   borough: 'Tower Hamlets',            region: 'east', lat: 51.5100, lng: -0.0568 },
  { slug: 'limehouse',          name: 'Limehouse',            postcode: 'E14',  borough: 'Tower Hamlets',            region: 'east', lat: 51.5119, lng: -0.0380 },
  { slug: 'cubitt-town',        name: 'Cubitt Town',          postcode: 'E14',  borough: 'Tower Hamlets',            region: 'east', lat: 51.4998, lng: -0.0082 },
  { slug: 'west-ham',           name: 'West Ham',             postcode: 'E15',  borough: 'Newham',                   region: 'east', lat: 51.5315, lng: 0.0029  },
  { slug: 'plaistow',           name: 'Plaistow',             postcode: 'E13',  borough: 'Newham',                   region: 'east', lat: 51.5293, lng: 0.0208  },
  { slug: 'upton-park',         name: 'Upton Park',           postcode: 'E13',  borough: 'Newham',                   region: 'east', lat: 51.5352, lng: 0.0350  },
  { slug: 'manor-park',         name: 'Manor Park',           postcode: 'E12',  borough: 'Newham',                   region: 'east', lat: 51.5498, lng: 0.0533  },
  { slug: 'east-ham',           name: 'East Ham',             postcode: 'E6',   borough: 'Newham',                   region: 'east', lat: 51.5393, lng: 0.0514  },
  { slug: 'barking',            name: 'Barking',              postcode: 'IG11', borough: 'Barking & Dagenham',       region: 'east', lat: 51.5362, lng: 0.0804  },
  { slug: 'dagenham',           name: 'Dagenham',             postcode: 'RM10', borough: 'Barking & Dagenham',       region: 'east', lat: 51.5440, lng: 0.1479  },
  { slug: 'ilford',             name: 'Ilford',               postcode: 'IG1',  borough: 'Redbridge',                region: 'east', lat: 51.5591, lng: 0.0807  },
  { slug: 'seven-kings',        name: 'Seven Kings',          postcode: 'IG3',  borough: 'Redbridge',                region: 'east', lat: 51.5617, lng: 0.0955  },
  { slug: 'goodmayes',          name: 'Goodmayes',            postcode: 'IG3',  borough: 'Redbridge',                region: 'east', lat: 51.5645, lng: 0.1096  },
  { slug: 'chadwell-heath',     name: 'Chadwell Heath',       postcode: 'RM6',  borough: 'Redbridge',                region: 'east', lat: 51.5668, lng: 0.1351  },
  { slug: 'romford',            name: 'Romford',              postcode: 'RM1',  borough: 'Havering',                 region: 'east', lat: 51.5754, lng: 0.1828  },
  { slug: 'upminster',          name: 'Upminster',            postcode: 'RM14', borough: 'Havering',                 region: 'east', lat: 51.5558, lng: 0.2508  },
  { slug: 'rainham',            name: 'Rainham',              postcode: 'RM13', borough: 'Havering',                 region: 'east', lat: 51.5175, lng: 0.1882  },
  { slug: 'beckton',            name: 'Beckton',              postcode: 'E6',   borough: 'Newham',                   region: 'east', lat: 51.5157, lng: 0.0614  },
  { slug: 'silvertown',         name: 'Silvertown',           postcode: 'E16',  borough: 'Newham',                   region: 'east', lat: 51.5046, lng: 0.0230  },
  { slug: 'custom-house',       name: 'Custom House',         postcode: 'E16',  borough: 'Newham',                   region: 'east', lat: 51.5093, lng: 0.0295  },
  { slug: 'north-woolwich',     name: 'North Woolwich',       postcode: 'E16',  borough: 'Newham',                   region: 'east', lat: 51.5002, lng: 0.0662  },
  { slug: 'leytonstone',        name: 'Leytonstone',          postcode: 'E11',  borough: 'Waltham Forest',           region: 'east', lat: 51.5663, lng: 0.0086  },
  { slug: 'chingford',          name: 'Chingford',            postcode: 'E4',   borough: 'Waltham Forest',           region: 'east', lat: 51.6275, lng: -0.0135 },
  { slug: 'woodford',           name: 'Woodford',             postcode: 'E18',  borough: 'Redbridge',                region: 'east', lat: 51.5985, lng: 0.0271  },

  // ── Additional South London areas ─────────────────────────────────────────
  { slug: 'herne-hill',         name: 'Herne Hill',           postcode: 'SE24', borough: 'Lambeth',                  region: 'south', lat: 51.4552, lng: -0.1020 },
  { slug: 'tulse-hill',         name: 'Tulse Hill',           postcode: 'SW2',  borough: 'Lambeth',                  region: 'south', lat: 51.4481, lng: -0.1130 },
  { slug: 'west-norwood',       name: 'West Norwood',         postcode: 'SE27', borough: 'Lambeth',                  region: 'south', lat: 51.4378, lng: -0.1059 },
  { slug: 'norbury',            name: 'Norbury',              postcode: 'SW16', borough: 'Croydon',                  region: 'south', lat: 51.4063, lng: -0.1236 },
  { slug: 'thornton-heath',     name: 'Thornton Heath',       postcode: 'CR7',  borough: 'Croydon',                  region: 'south', lat: 51.3990, lng: -0.1065 },
  { slug: 'south-croydon',      name: 'South Croydon',        postcode: 'CR2',  borough: 'Croydon',                  region: 'south', lat: 51.3570, lng: -0.0921 },
  { slug: 'purley',             name: 'Purley',               postcode: 'CR8',  borough: 'Croydon',                  region: 'south', lat: 51.3384, lng: -0.1133 },
  { slug: 'sutton',             name: 'Sutton',               postcode: 'SM1',  borough: 'Sutton',                   region: 'south', lat: 51.3618, lng: -0.1945 },
  { slug: 'cheam',              name: 'Cheam',                postcode: 'SM3',  borough: 'Sutton',                   region: 'south', lat: 51.3598, lng: -0.2235 },
  { slug: 'carshalton',         name: 'Carshalton',           postcode: 'SM5',  borough: 'Sutton',                   region: 'south', lat: 51.3649, lng: -0.1658 },
  { slug: 'morden',             name: 'Morden',               postcode: 'SM4',  borough: 'Merton',                   region: 'south', lat: 51.4014, lng: -0.1973 },
  { slug: 'mitcham',            name: 'Mitcham',              postcode: 'CR4',  borough: 'Merton',                   region: 'south', lat: 51.4006, lng: -0.1524 },
  { slug: 'colliers-wood',      name: 'Colliers Wood',        postcode: 'SW19', borough: 'Merton',                   region: 'south', lat: 51.4126, lng: -0.1768 },
  { slug: 'south-wimbledon',    name: 'South Wimbledon',      postcode: 'SW19', borough: 'Merton',                   region: 'south', lat: 51.4142, lng: -0.1886 },
  { slug: 'raynes-park',        name: 'Raynes Park',          postcode: 'SW20', borough: 'Merton',                   region: 'south', lat: 51.4091, lng: -0.2186 },
  { slug: 'new-malden',         name: 'New Malden',           postcode: 'KT3',  borough: 'Kingston upon Thames',     region: 'south', lat: 51.4028, lng: -0.2546 },
  { slug: 'worcester-park',     name: 'Worcester Park',       postcode: 'KT4',  borough: 'Sutton',                   region: 'south', lat: 51.3780, lng: -0.2388 },
  { slug: 'norwood',            name: 'Norwood',              postcode: 'SE25', borough: 'Croydon',                  region: 'south', lat: 51.4012, lng: -0.0832 },
  { slug: 'forest-hill',        name: 'Forest Hill',          postcode: 'SE23', borough: 'Lewisham',                 region: 'south', lat: 51.4412, lng: -0.0541 },
  { slug: 'sydenham',           name: 'Sydenham',             postcode: 'SE26', borough: 'Lewisham',                 region: 'south', lat: 51.4268, lng: -0.0558 },
  { slug: 'bellingham',         name: 'Bellingham',           postcode: 'SE6',  borough: 'Lewisham',                 region: 'south', lat: 51.4406, lng: -0.0203 },
  { slug: 'catford',            name: 'Catford',              postcode: 'SE6',  borough: 'Lewisham',                 region: 'south', lat: 51.4454, lng: -0.0195 },
  { slug: 'brockley',           name: 'Brockley',             postcode: 'SE4',  borough: 'Lewisham',                 region: 'south', lat: 51.4647, lng: -0.0391 },
  { slug: 'crofton-park',       name: 'Crofton Park',         postcode: 'SE4',  borough: 'Lewisham',                 region: 'south', lat: 51.4573, lng: -0.0374 },
  { slug: 'honor-oak',          name: 'Honor Oak',            postcode: 'SE23', borough: 'Lewisham',                 region: 'south', lat: 51.4533, lng: -0.0536 },
  { slug: 'blackheath',         name: 'Blackheath',           postcode: 'SE3',  borough: 'Greenwich',                region: 'south', lat: 51.4677, lng: 0.0087  },
  { slug: 'woolwich',           name: 'Woolwich',             postcode: 'SE18', borough: 'Greenwich',                region: 'south', lat: 51.4907, lng: 0.0690  },
  { slug: 'plumstead',          name: 'Plumstead',            postcode: 'SE18', borough: 'Greenwich',                region: 'south', lat: 51.4878, lng: 0.0828  },
  { slug: 'abbey-wood',         name: 'Abbey Wood',           postcode: 'SE2',  borough: 'Greenwich',                region: 'south', lat: 51.4905, lng: 0.1188  },
  { slug: 'thamesmead',         name: 'Thamesmead',           postcode: 'SE28', borough: 'Greenwich',                region: 'south', lat: 51.5020, lng: 0.1180  },
  { slug: 'eltham',             name: 'Eltham',               postcode: 'SE9',  borough: 'Greenwich',                region: 'south', lat: 51.4522, lng: 0.0574  },
  { slug: 'mottingham',         name: 'Mottingham',           postcode: 'SE9',  borough: 'Greenwich',                region: 'south', lat: 51.4343, lng: 0.0427  },
  { slug: 'sidcup',             name: 'Sidcup',               postcode: 'DA14', borough: 'Bexley',                   region: 'south', lat: 51.4277, lng: 0.1051  },
  { slug: 'bexleyheath',        name: 'Bexleyheath',          postcode: 'DA6',  borough: 'Bexley',                   region: 'south', lat: 51.4596, lng: 0.1407  },
  { slug: 'welling',            name: 'Welling',              postcode: 'DA16', borough: 'Bexley',                   region: 'south', lat: 51.4681, lng: 0.1093  },
  { slug: 'bromley',            name: 'Bromley',              postcode: 'BR1',  borough: 'Bromley',                  region: 'south', lat: 51.4071, lng: 0.0137  },
  { slug: 'beckenham',          name: 'Beckenham',            postcode: 'BR3',  borough: 'Bromley',                  region: 'south', lat: 51.4080, lng: -0.0238 },
  { slug: 'penge',              name: 'Penge',                postcode: 'SE20', borough: 'Bromley',                  region: 'south', lat: 51.4115, lng: -0.0524 },
  { slug: 'anerley',            name: 'Anerley',              postcode: 'SE20', borough: 'Bromley',                  region: 'south', lat: 51.4091, lng: -0.0627 },

  // ── Additional West London areas ──────────────────────────────────────────
  { slug: 'north-kensington',   name: 'North Kensington',     postcode: 'W10',  borough: 'Kensington & Chelsea',     region: 'west', lat: 51.5179, lng: -0.2074 },
  { slug: 'ladbroke-grove',     name: 'Ladbroke Grove',       postcode: 'W11',  borough: 'Kensington & Chelsea',     region: 'west', lat: 51.5169, lng: -0.2098 },
  { slug: 'westbourne-park',    name: 'Westbourne Park',      postcode: 'W2',   borough: 'Westminster',              region: 'west', lat: 51.5209, lng: -0.1979 },
  { slug: 'maida-vale',         name: 'Maida Vale',           postcode: 'W9',   borough: 'Westminster',              region: 'west', lat: 51.5279, lng: -0.1844 },
  { slug: 'little-venice',      name: 'Little Venice',        postcode: 'W9',   borough: 'Westminster',              region: 'west', lat: 51.5233, lng: -0.1853 },
  { slug: 'west-brompton',      name: 'West Brompton',        postcode: 'SW10', borough: 'Kensington & Chelsea',     region: 'west', lat: 51.4839, lng: -0.1950 },
  { slug: 'parsons-green',      name: "Parson's Green",       postcode: 'SW6',  borough: 'Hammersmith & Fulham',     region: 'west', lat: 51.4739, lng: -0.1945 },
  { slug: 'barons-court',       name: "Baron's Court",        postcode: 'W14',  borough: 'Hammersmith & Fulham',     region: 'west', lat: 51.4898, lng: -0.2145 },
  { slug: 'ravenscourt-park',   name: 'Ravenscourt Park',     postcode: 'W6',   borough: 'Hammersmith & Fulham',     region: 'west', lat: 51.4937, lng: -0.2379 },
  { slug: 'stamford-brook',     name: 'Stamford Brook',       postcode: 'W4',   borough: 'Hounslow',                 region: 'west', lat: 51.4936, lng: -0.2508 },
  { slug: 'turnham-green',      name: 'Turnham Green',        postcode: 'W4',   borough: 'Hounslow',                 region: 'west', lat: 51.4951, lng: -0.2554 },
  { slug: 'gunnersbury',        name: 'Gunnersbury',          postcode: 'W4',   borough: 'Hounslow',                 region: 'west', lat: 51.4935, lng: -0.2854 },
  { slug: 'kew',                name: 'Kew',                  postcode: 'TW9',  borough: 'Richmond upon Thames',     region: 'west', lat: 51.4765, lng: -0.2859 },
  { slug: 'isleworth',          name: 'Isleworth',            postcode: 'TW7',  borough: 'Hounslow',                 region: 'west', lat: 51.4675, lng: -0.3261 },
  { slug: 'whitton',            name: 'Whitton',              postcode: 'TW2',  borough: 'Richmond upon Thames',     region: 'west', lat: 51.4446, lng: -0.3617 },
  { slug: 'feltham',            name: 'Feltham',              postcode: 'TW13', borough: 'Hounslow',                 region: 'west', lat: 51.4488, lng: -0.4085 },
  { slug: 'hanworth',           name: 'Hanworth',             postcode: 'TW13', borough: 'Hounslow',                 region: 'west', lat: 51.4449, lng: -0.3978 },
  { slug: 'hampton',            name: 'Hampton',              postcode: 'TW12', borough: 'Richmond upon Thames',     region: 'west', lat: 51.4209, lng: -0.3699 },
  { slug: 'east-molesey',       name: 'East Molesey',         postcode: 'KT8',  borough: 'Elmbridge',                region: 'west', lat: 51.4047, lng: -0.3511 },
  { slug: 'greenford',          name: 'Greenford',            postcode: 'UB6',  borough: 'Ealing',                   region: 'west', lat: 51.5299, lng: -0.3464 },
  { slug: 'hanwell',            name: 'Hanwell',              postcode: 'W7',   borough: 'Ealing',                   region: 'west', lat: 51.5090, lng: -0.3387 },
  { slug: 'norwood-green',      name: 'Norwood Green',        postcode: 'UB2',  borough: 'Ealing',                   region: 'west', lat: 51.5037, lng: -0.3706 },
  { slug: 'hayes',              name: 'Hayes',                postcode: 'UB3',  borough: 'Hillingdon',               region: 'west', lat: 51.5088, lng: -0.4207 },
  { slug: 'uxbridge',           name: 'Uxbridge',             postcode: 'UB8',  borough: 'Hillingdon',               region: 'west', lat: 51.5462, lng: -0.4786 },
  { slug: 'ruislip',            name: 'Ruislip',              postcode: 'HA4',  borough: 'Hillingdon',               region: 'west', lat: 51.5731, lng: -0.4221 },
  { slug: 'northolt',           name: 'Northolt',             postcode: 'UB5',  borough: 'Ealing',                   region: 'west', lat: 51.5479, lng: -0.3681 },
  { slug: 'perivale',           name: 'Perivale',             postcode: 'UB6',  borough: 'Ealing',                   region: 'west', lat: 51.5370, lng: -0.3280 },
];

// ─── Service definitions ──────────────────────────────────────────────────────

export const SERVICES: Record<ServiceType, { label: string; slug: ServiceType; shortLabel: string }> = {
  delivery: { label: 'Same-Day Courier Delivery',   slug: 'delivery',  shortLabel: 'Delivery' },
  parcel:   { label: 'Parcel & Package Courier',    slug: 'parcel',    shortLabel: 'Parcel'   },
  pharmacy: { label: 'Pharmacy & Prescription Delivery', slug: 'pharmacy', shortLabel: 'Pharmacy' },
  food:     { label: 'Food & Restaurant Delivery',  slug: 'food',      shortLabel: 'Food'     },
};

// ─── Page generator ───────────────────────────────────────────────────────────

function serviceIntro(area: LondonArea, service: ServiceType): string {
  switch (service) {
    case 'delivery':
      return `Need a fast, reliable courier in ${area.name} (${area.postcode})? Quickzy dispatches same-day drivers across ${area.borough} with live tracking and per-mile pricing. Whether it's a single envelope or a multi-stop manifest, our drivers cover ${area.name} from early morning until late evening.`;
    case 'parcel':
      return `Quickzy handles parcel and package couriers in ${area.name} (${area.postcode}) with door-to-door speed. From next-day returns to bulk e-commerce fulfilment runs across ${area.borough}, we provide photo proof-of-delivery, barcode scanning, and driver-signed receipts.`;
    case 'pharmacy':
      return `Quickzy partners with pharmacies and healthcare providers across ${area.name} (${area.postcode}) to deliver prescriptions, medical supplies, and OTC medication directly to patients' doors within ${area.borough}. GDPR-compliant, discreet, and trackable end-to-end.`;
    case 'food':
      return `Hot, fresh, on time: Quickzy's dedicated food delivery couriers serve restaurants, caterers, and meal-prep businesses in ${area.name} (${area.postcode}). Temperature-managed runs across ${area.borough} with precise ETA windows and contactless doorstep drop.`;
  }
}

function serviceKeyPoints(area: LondonArea, service: ServiceType): string[] {
  const base = [
    `Covering all postcode sectors within ${area.postcode}`,
    `Live GPS tracking via the Quickzy driver app`,
    `14:00 GMT same-day cutoff — order before noon for fastest dispatch`,
    `Competitive per-mile pricing, no hidden surcharges`,
  ];
  switch (service) {
    case 'delivery':
      return [...base, `Point-to-point within ${area.name} and neighbouring areas`, `Multi-stop batch manifests via CSV upload`];
    case 'parcel':
      return [...base, `Barcode scanning and photo proof-of-delivery`, `Bulk manifest import for e-commerce sellers in ${area.borough}`];
    case 'pharmacy':
      return [...base, `Discreet GDPR-compliant prescription handling`, `Cold-chain capability for temperature-sensitive medications`, `Driver DBS-checked and pharmacy-trained`];
    case 'food':
      return [...base, `Insulated food-grade bags for hot and cold items`, `Restaurant-grade ETA communication to end customers`, `Evening and weekend runs available`];
  }
}

export function buildServicePageData(area: LondonArea, service: ServiceType): ServicePageData {
  const svc = SERVICES[service];
  return {
    areaSlug: area.slug,
    serviceSlug: service,
    title:           `${svc.label} in ${area.name}`,
    seoTitle:        `${svc.shortLabel} Delivery ${area.name} ${area.postcode} | Quickzy London`,
    metaDescription: `${svc.label} in ${area.name}, ${area.postcode}. Quickzy same-day couriers cover all of ${area.borough}. Fast, trackable, per-mile pricing.`,
    h1:              `${svc.label} in ${area.name}, ${area.postcode}`,
    intro:           serviceIntro(area, service),
    keyPoints:       serviceKeyPoints(area, service),
  };
}

// ─── Exports for sitemap & static params ─────────────────────────────────────

/** Every area+service combination — used for generateStaticParams and sitemap */
export function getAllServicePages(): Array<{ areaSlug: string; serviceSlug: ServiceType }> {
  const combos: Array<{ areaSlug: string; serviceSlug: ServiceType }> = [];
  for (const area of LONDON_AREAS) {
    for (const service of Object.keys(SERVICES) as ServiceType[]) {
      combos.push({ areaSlug: area.slug, serviceSlug: service });
    }
  }
  return combos;
}

/** Look up area + page data by slug pair — used by the page component */
export function getServicePageData(areaSlug: string, serviceSlug: string): ServicePageData | null {
  const area = LONDON_AREAS.find((a) => a.slug === areaSlug);
  const service = serviceSlug as ServiceType;
  if (!area || !SERVICES[service]) return null;
  return buildServicePageData(area, service);
}

/** Look up an area by slug — used by area hub pages */
export function getAreaBySlug(slug: string): LondonArea | null {
  return LONDON_AREAS.find((a) => a.slug === slug) ?? null;
}
