import { ProductEntity, PackingEntity } from "./Products";
import CustomerEntity from "./Customers";

// Enums
export type OrderStatusEnum =
  'Registered' |
  'Finished' |
  'Canceled';

//#region Table Entities
export interface OrderItemEntity {
  id?: number;
  order_id?: number;
  product_id: number;
  packing_id: number | null;
  amount: number;
  unit_price?: number;
}

export interface OrderEntity {
  id?: number;
  customer_id: number;
  order_date: string;
  delivery_date: string;
  status: OrderStatusEnum;
  discount: number;
  shipping: number;
  observation?: string | null;
}
//#endregion

//#region Auxiliares Entities
export interface FullOrderItemEntity extends OrderItemEntity {
  product?: ProductEntity;
  packing?: PackingEntity;
}

export interface FullOrderEntity extends OrderEntity {
  items: FullOrderItemEntity[];
  customer?: CustomerEntity;
}
//#endregion