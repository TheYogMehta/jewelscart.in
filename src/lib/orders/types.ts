export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "in_transit",
  "delivered",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImage: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: any;
  paymentId: string | null;
  paymentOrderId: string | null;
  paymentSignature: string | null;
  paymentMethod: string | null;
  trackingId: string | null;
  trackingUrl: string | null;
  trackingCourier: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
}
