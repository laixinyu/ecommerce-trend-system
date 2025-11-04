// 供应链模块类型定义

export type OrderPlatform = 'shopify' | 'woocommerce' | 'amazon';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type ShippingCarrier = '17track' | 'shipstation' | 'usps' | 'fedex' | 'ups' | 'dhl';

export interface InventoryItem {
  id: string;
  user_id: string;
  sku: string;
  product_name: string | null;
  quantity_on_hand: number;
  quantity_in_transit: number;
  reorder_point: number | null;
  reorder_quantity: number | null;
  unit_cost: number | null;
  warehouse_location: string | null;
  last_updated: string;
  created_at: string;
}

export interface OrderItem {
  sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ShippingInfo {
  tracking_number: string;
  carrier: ShippingCarrier;
  status: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  tracking_url?: string;
}

export interface Order {
  id: string;
  user_id: string;
  external_order_id: string | null;
  platform: OrderPlatform | null;
  status: OrderStatus | null;
  items: OrderItem[] | null;
  total_amount: number | null;
  shipping_info: ShippingInfo | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  date: string;
  sku: string;
  quantity: number;
  revenue: number;
}

export interface InventoryAlert {
  item: InventoryItem;
  alert_type: 'low_stock' | 'out_of_stock' | 'reorder_needed';
  message: string;
  severity: 'warning' | 'critical';
}

export interface InventoryMetrics {
  total_items: number;
  total_value: number;
  low_stock_items: number;
  out_of_stock_items: number;
  average_turnover_rate: number;
}

export interface OrderMetrics {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
}

export interface SupplyChainKPI {
  order_fulfillment_rate: number;
  average_fulfillment_time: number;
  inventory_turnover_rate: number;
  stockout_rate: number;
  on_time_delivery_rate: number;
}

// Shopify相关类型
export interface ShopifyProduct {
  id: number;
  title: string;
  variants: ShopifyVariant[];
}

export interface ShopifyVariant {
  id: number;
  sku: string;
  inventory_quantity: number;
  price: string;
}

export interface ShopifyOrder {
  id: number;
  order_number: string;
  line_items: ShopifyLineItem[];
  total_price: string;
  fulfillment_status: string | null;
  financial_status: string;
  created_at: string;
}

export interface ShopifyLineItem {
  sku: string;
  name: string;
  quantity: number;
  price: string;
}

// 17track相关类型
export interface TrackingInfo {
  tracking_number: string;
  carrier_code: string;
  status: string;
  events: TrackingEvent[];
  estimated_delivery?: string;
}

export interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

// ShipStation相关类型
export interface ShipStationShipment {
  shipmentId: number;
  orderId: number;
  trackingNumber: string;
  carrierCode: string;
  serviceCode: string;
  shipDate: string;
  deliveryDate?: string;
}
