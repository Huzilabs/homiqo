import type { ORDER_STATUSES } from "./config";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  description: string;
  features: string[];
  price: number;
  compare_at_price: number | null;
  stock: number;
  images: string[];
  videos: string[];
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  notes: string | null;
  payment_method: string;
  status: OrderStatus;
  tracking_number: string | null;
  courier: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderEvent {
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface TrackedOrder {
  order_number: string;
  customer_name: string;
  city: string;
  status: OrderStatus;
  courier: string | null;
  tracking_number: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: string;
  created_at: string;
  items: Pick<OrderItem, "product_name" | "product_image" | "unit_price" | "quantity" | "line_total">[];
  events: OrderEvent[];
}

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
}
