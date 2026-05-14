// ─── Core Domain Types ─────────────────────────────────────────
// These mirror the Firebase Realtime Database / Firestore document structure.
// When backend integration happens, swap service layer — UI stays unchanged.

export type AvailabilityStatus = "open" | "closed" | "busy" | "closing_soon";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Offer = {
  id: string;
  label: string;
  type: "percent_off" | "flat_off" | "free_delivery" | "bogo";
  value?: number;
};

export type Outlet = {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  cuisine: string;
  logo: string;
  coverImage: string;
  rating: number;
  ratingCount: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  distanceKm: number;
  availability: AvailabilityStatus;
  openingTime: string;
  closingTime: string;
  minOrderAmount: number;
  deliveryFeeStructure: DeliveryFeeSlot[];
  offers: Offer[];
  tags: string[];
  address: string;
  location: Coordinates;
  isVegOnly: boolean;
  featured: boolean;
  createdAt: string;
};

export type DeliveryFeeSlot = {
  upToKm: number;
  fee: number;
};

export type MenuItemAddon = {
  id: string;
  name: string;
  price: number;
};

export type MenuItemSize = {
  id: string;
  name: string;
  price: number;
};

export type MenuItemCrust = {
  id: string;
  name: string;
  extraPrice: number;
};

export type MenuItem = {
  id: string;
  outletId: string;
  businessId: string;
  outletName: string;
  name: string;
  description: string;
  image: string;
  category: string;
  subCategory?: string;
  isVeg: boolean;
  price: number;
  rating: number;
  ratingCount: number;
  isBestSeller: boolean;
  isRecommended: boolean;
  isSpicy?: boolean;
  isAvailable: boolean;
  customizable: boolean;
  addons: MenuItemAddon[];
  sizes: MenuItemSize[];
  crusts?: MenuItemCrust[];
  preparationTimeMin: number;
  sortOrder: number;
};

export type CartItemCustomization = {
  size?: MenuItemSize;
  crust?: MenuItemCrust;
  addons: MenuItemAddon[];
  extraCheese: boolean;
  instructions: string;
};

export type CartItem = {
  id: string;
  menuItemId: string;
  outletId: string;
  name: string;
  image: string;
  basePrice: number;
  price: number;
  quantity: number;
  customization: CartItemCustomization;
};

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Preparing"
  | "Packed"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "upi" | "card" | "wallet" | "cod";

export type OrderItem = {
  menuItemId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  customization?: CartItemCustomization;
};

export type DeliveryAddress = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  landmark?: string;
  lat: number;
  lng: number;
  coords?: Coordinates;
};

export type Order = {
  id: string;
  userId: string;
  outletId: string;
  outletName: string;
  businessId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string }[];
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress;
  couponCode?: string;
  discount?: number;
  estimatedMinutes: number;
  riderName?: string;
  riderPhone?: string;
  riderVehicle?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserAddress = {
  id: string;
  label: "Home" | "Work" | "Other";
  address: string;
  landmark?: string;
  coords: Coordinates;
  isDefault: boolean;
};

export type WalletTransaction = {
  id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  orderId?: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  loyaltyPoints: number;
  walletBalance: number;
  walletHistory: WalletTransaction[];
  savedAddresses: UserAddress[];
  createdAt: string;
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  outletId: string;
  outletName: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
};

export type ScheduleSlot = {
  label: string;
  time: string;
};
