/**
 * ShipStation API客户端
 * 用于管理物流和追踪信息
 */

import { Logger } from '@/lib/utils/logger';
import { retryWithBackoff } from '@/lib/utils/retry';
import type { ShipStationShipment, ShippingInfo } from '@/types/supply-chain';

interface ShipStationConfig {
  api_key: string;
  api_secret: string;
}

interface ShipStationOrder {
  orderId: number;
  orderNumber: string;
  orderStatus: string;
  shipments: ShipStationShipment[];
}

export class ShipStationClient {
  private config: ShipStationConfig;
  private baseUrl = 'https://ssapi.shipstation.com';
  private authHeader: string;

  constructor(config: ShipStationConfig) {
    this.config = config;
    // ShipStation使用Basic Auth
    this.authHeader = `Basic ${Buffer.from(
      `${config.api_key}:${config.api_secret}`
    ).toString('base64')}`;
  }

  /**
   * 发起API请求
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await retryWithBackoff(async () => {
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
          ...options.headers,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`ShipStation API error: ${res.status} - ${error}`);
      }

      return res;
    });

    return response.json();
  }

  /**
   * 获取订单列表
   */
  async getOrders(params: {
    orderStatus?: string;
    page?: number;
    pageSize?: number;
    createDateStart?: string;
    createDateEnd?: string;
  } = {}): Promise<ShipStationOrder[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.orderStatus) queryParams.append('orderStatus', params.orderStatus);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.createDateStart)
        queryParams.append('createDateStart', params.createDateStart);
      if (params.createDateEnd) queryParams.append('createDateEnd', params.createDateEnd);

      Logger.info('Fetching orders from ShipStation', params);

      const response = await this.request<{ orders: ShipStationOrder[] }>(
        `/orders?${queryParams.toString()}`
      );

      Logger.info('Successfully fetched ShipStation orders', {
        count: response.orders.length,
      });

      return response.orders;
    } catch (error) {
      Logger.error('Failed to fetch ShipStation orders', error as Error);
      throw error;
    }
  }

  /**
   * 获取单个订单
   */
  async getOrder(orderId: number): Promise<ShipStationOrder> {
    try {
      const response = await this.request<ShipStationOrder>(`/orders/${orderId}`);
      return response;
    } catch (error) {
      Logger.error('Failed to fetch order', error as Error, { orderId });
      throw error;
    }
  }

  /**
   * 获取物流信息
   */
  async getShipments(params: {
    orderId?: number;
    page?: number;
    pageSize?: number;
    shipDateStart?: string;
    shipDateEnd?: string;
  } = {}): Promise<ShipStationShipment[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.orderId) queryParams.append('orderId', params.orderId.toString());
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.shipDateStart) queryParams.append('shipDateStart', params.shipDateStart);
      if (params.shipDateEnd) queryParams.append('shipDateEnd', params.shipDateEnd);

      Logger.info('Fetching shipments from ShipStation', params);

      const response = await this.request<{ shipments: ShipStationShipment[] }>(
        `/shipments?${queryParams.toString()}`
      );

      Logger.info('Successfully fetched ShipStation shipments', {
        count: response.shipments.length,
      });

      return response.shipments;
    } catch (error) {
      Logger.error('Failed to fetch ShipStation shipments', error as Error);
      throw error;
    }
  }

  /**
   * 根据追踪号获取物流信息
   */
  async getShipmentByTracking(trackingNumber: string): Promise<ShipStationShipment | null> {
    try {
      const shipments = await this.getShipments();
      return (
        shipments.find((s) => s.trackingNumber === trackingNumber) || null
      );
    } catch (error) {
      Logger.error('Failed to get shipment by tracking', error as Error, {
        trackingNumber,
      });
      throw error;
    }
  }

  /**
   * 转换ShipStation物流信息到系统格式
   */
  convertToShippingInfo(shipment: ShipStationShipment): ShippingInfo {
    // 映射ShipStation承运商代码
    const carrierMap: Record<string, string> = {
      ups: 'ups',
      usps: 'usps',
      fedex: 'fedex',
      dhl: 'dhl',
    };

    return {
      tracking_number: shipment.trackingNumber,
      carrier: (carrierMap[shipment.carrierCode.toLowerCase()] ||
        'shipstation') as ShippingInfo['carrier'],
      status: 'shipped',
      estimated_delivery: shipment.deliveryDate,
      actual_delivery: shipment.deliveryDate,
      tracking_url: `https://www.shipstation.com/tracking/${shipment.trackingNumber}`,
    };
  }

  /**
   * 批量获取订单的物流信息
   */
  async batchGetShippingInfo(orderIds: number[]): Promise<Map<number, ShippingInfo>> {
    try {
      const shippingInfoMap = new Map<number, ShippingInfo>();

      for (const orderId of orderIds) {
        const shipments = await this.getShipments({ orderId });
        if (shipments.length > 0) {
          // 使用最新的物流信息
          const latestShipment = shipments[shipments.length - 1];
          shippingInfoMap.set(orderId, this.convertToShippingInfo(latestShipment));
        }
      }

      return shippingInfoMap;
    } catch (error) {
      Logger.error('Failed to batch get shipping info', error as Error);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/orders?pageSize=1');
      return true;
    } catch (error) {
      Logger.error('ShipStation connection test failed', error as Error);
      return false;
    }
  }
}
