import ICustomerRepository from "../ICustomerRepository";
import CustomerEntity from "../../Entities/Customers";
import Database from "./Database";

export default class CustomerRepository implements ICustomerRepository {
  constructor(
    private db: Database
  ) {}

  Create(entity: CustomerEntity): Promise<void> {
    throw new Error("Method not implemented.");
  }
  Update(entity: Partial<CustomerEntity>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  Show(entityId: number): Promise<CustomerEntity> {
    throw new Error("Method not implemented.");
  }
  List(filters?: object, sort?: object[]): Promise<CustomerEntity[]> {
    throw new Error("Method not implemented.");
  }
  Delete(entityId: number): Promise<void> {
    throw new Error("Method not implemented.");
  }
}