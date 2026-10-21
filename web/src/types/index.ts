export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  merchantId: string;
  category: string;
  image: string;
  storageTemp: 'ambient' | 'chilled' | 'frozen';
  requiresColdBag: boolean;
}

export interface Merchant {
  id: string;
  name: string;
  category: 'Butcher' | 'Artisan Bakery' | 'Green Grocer' | 'Deli & Cheese' | 'Fishery';
  rating: number;
  reviewsCount: number;
  prepTimeMinutes: number;
  address: string;
  highStreetCorridor: string;
  lat: number;
  lng: number;
  image: string;
  badge: string;
  isOpen: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  merchant: Merchant;
}

export interface Waypoint {
  id: string;
  type: 'pickup' | 'dropoff';
  merchantId?: string;
  locationName: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pending' | 'arrived' | 'completed';
  hasColdChain: boolean;
  qrPayload?: string;
  backupPin?: string;
  itemsSummary: string;
}

export interface DeliveryTrip {
  id: string;
  driverName: string;
  driverVehicle: string;
  status: 'dispatching' | 'active' | 'completed';
  totalDistanceKm: number;
  estimatedMinutes: number;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  coldChainLimitMins: number;
}
