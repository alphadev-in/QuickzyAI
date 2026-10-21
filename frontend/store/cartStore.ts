import { create } from 'zustand';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: any;
  image?: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: CartItem, restaurantId: string, restaurantName: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,
  restaurantName: null,
  
  addItem: (item, restaurantId, restaurantName) => {
    const state = get();
    
    // If cart has items from different restaurant, clear it
    if (state.restaurantId && state.restaurantId !== restaurantId) {
      set({ items: [item], restaurantId, restaurantName });
      return;
    }
    
    const existingItem = state.items.find(i => i.menuItemId === item.menuItemId);
    
    if (existingItem) {
      set({
        items: state.items.map(i => 
          i.menuItemId === item.menuItemId 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
        restaurantId,
        restaurantName
      });
    } else {
      set({ 
        items: [...state.items, item],
        restaurantId,
        restaurantName
      });
    }
  },
  
  removeItem: (menuItemId) => {
    const state = get();
    const newItems = state.items.filter(i => i.menuItemId !== menuItemId);
    set({ 
      items: newItems,
      restaurantId: newItems.length === 0 ? null : state.restaurantId,
      restaurantName: newItems.length === 0 ? null : state.restaurantName
    });
  },
  
  updateQuantity: (menuItemId, quantity) => {
    const state = get();
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }
    set({
      items: state.items.map(i => 
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      )
    });
  },
  
  clearCart: () => {
    set({ items: [], restaurantId: null, restaurantName: null });
  },
  
  getTotal: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },
  
  getItemCount: () => {
    const state = get();
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));