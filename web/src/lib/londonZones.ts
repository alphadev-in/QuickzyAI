// London zone landing pages: shared by the location route, its metadata and the sitemap.
export interface LocationZone {
  slug: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  zone: string;
  postcodes: string[];
  neighborhoods: string[];
  summary: string;
  keyServices: string[];
}

export const LONDON_ZONES: Record<string, LocationZone> = {
  'central-london': {
    slug: 'central-london',
    title: 'Central London Same-Day Courier Delivery',
    seoTitle: 'Same-Day Courier Central London EC WC W1 SW1 | Quickzy',
    metaDescription: 'Fast 60-minute and same-day delivery courier service across Central London, City of London, Westminster, Holborn, Mayfair, Soho, and Covent Garden.',
    zone: 'Central London',
    postcodes: ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'W1', 'SW1'],
    neighborhoods: ['City of London (Square Mile)', 'Westminster', 'Mayfair', 'Soho', 'Covent Garden', 'Holborn', 'Fitzrovia', 'St James’s', 'Bloomsbury'],
    summary: 'Ultra-dense urban routing optimized for Central London congestion zones and low-emission zones. Rapid cycle couriers and electric cargo vehicles deliver pharmacy supplies, corporate parcels, and fine food within 60-90 minutes.',
    keyServices: ['Same-day prescription and medical clinic delivery', 'Priority business documents and corporate packages', 'Artisan food and temperature-sensitive catering', 'Bulk manifest delivery to corporate headquarters'],
  },
  'north-london': {
    slug: 'north-london',
    title: 'North London Same-Day Courier Delivery',
    seoTitle: 'Rapid Same-Day Delivery North London (N, NW) | Quickzy',
    metaDescription: 'Reliable point-to-point courier across North London: Camden, Islington, Highbury, Hampstead, Finchley and Highgate for pharmacies, parcels and merchants.',
    zone: 'North London',
    postcodes: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N19', 'NW1', 'NW3', 'NW5', 'NW6', 'NW8'],
    neighborhoods: ['Camden Town', 'Islington & Angel', 'Hampstead', 'Highbury', 'Highgate', 'Finchley', 'St John’s Wood', 'Kentish Town', 'Muswell Hill'],
    summary: 'Comprehensive neighborhood distribution covering North London urban corridors and residential enclaves with dedicated routes for pharmacies, boutiques, and bulk parcel clients.',
    keyServices: ['Pharmacy therapeutics and repeat prescriptions', 'E-commerce returns and scheduled parcel pickups', 'Independent food producers and grocers', 'Afternoon scheduled delivery up to 14:00 GMT cutoff'],
  },
  'east-london': {
    slug: 'east-london',
    title: 'East London & Canary Wharf Same-Day Courier Delivery',
    seoTitle: 'Same-Day Courier East London & Canary Wharf E1 E14 | Quickzy',
    metaDescription: 'Speedy courier dispatch in East London: Shoreditch, Hackney, Canary Wharf, Whitechapel, Stratford, and Bow. Same-day parcel and cold-chain logistics.',
    zone: 'East London & Docklands',
    postcodes: ['E1', 'E2', 'E3', 'E5', 'E8', 'E9', 'E14', 'E1W', 'E15', 'E16'],
    neighborhoods: ['Canary Wharf', 'Shoreditch', 'Hackney Central', 'Whitechapel', 'Wapping', 'Stratford', 'Bow', 'Bethnal Green', 'Isle of Dogs'],
    summary: 'Fast-paced logistics connecting East London tech hubs, creative quarters, and the Canary Wharf financial district with instant courier dispatch and manifest bulk import tools.',
    keyServices: ['Financial district corporate dispatch', 'Creative studio and e-commerce bulk manifests', 'Cold-chain specialty foods and bakery runs', 'Late-morning pickup with same-day drop-off guarantee'],
  },
  'west-london': {
    slug: 'west-london',
    title: 'West London Same-Day Courier Delivery',
    seoTitle: 'Same-Day Courier West London W SW Kensington | Quickzy',
    metaDescription: 'Premium same-day delivery service across West London: Kensington, Chelsea, Fulham, Notting Hill, Hammersmith, Chiswick, and Ealing.',
    zone: 'West London & Royal Boroughs',
    postcodes: ['W2', 'W6', 'W8', 'W11', 'W14', 'SW3', 'SW5', 'SW7', 'SW10', 'SW6', 'W5', 'W4'],
    neighborhoods: ['Kensington', 'Chelsea', 'Knightsbridge', 'Notting Hill', 'Fulham', 'Hammersmith', 'Chiswick', 'South Kensington', 'Holland Park'],
    summary: 'White-glove point-to-point courier solutions for Royal Boroughs and West London postcodes. Full care for high-value parcels, luxury retail, and pharmaceutical therapeutics.',
    keyServices: ['High-value goods and delicate item transit', 'Same-day luxury retail and boutique consignment', 'Private pharmacy delivery with chain-of-custody tracking', 'Multi-stop residential scheduled delivery'],
  },
};
