import { ProductEntity, PackingEntity } from "./Products";
import CustomerEntity from "./Customers";

// Enums
type OrderStatusEnum =
  'Registered' |
  'Finished' |
  'Canceled';

//#region Table Entities
export interface OrderItemEntity {
  id: number;
  order_id: number;
  product_id: number;
  packing_id: number;
  amount: number;
  unit_price: number;
}

export interface OrderEntity {
  id: number;
  customer_id: number;
  order_date: Date;
  delivery_date: Date;
  status: OrderStatusEnum;
  discount: number;
  shipping: number;
  observation: string;
}
//#endregion

//#region Auxiliares Entities
interface FullOrderItemEntity extends OrderItemEntity {
  product: ProductEntity;
  packing: PackingEntity;
}

export interface FullOrderEntity extends OrderEntity {
  items: FullOrderItemEntity[];
  customer: CustomerEntity;
}
//#endregion