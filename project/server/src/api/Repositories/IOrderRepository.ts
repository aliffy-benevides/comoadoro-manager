import IRepository from "./IRepository";
import { FullOrderEntity, OrderItemEntity } from "../Entities/Orders";

export default interface IOrderRepository extends IRepository<FullOrderEntity> {
  ListItems(orderId: number) : Promise<OrderItemEntity[]>
}
