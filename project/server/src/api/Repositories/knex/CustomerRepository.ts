import ICustomerRepository from "../ICustomerRepository";
import CustomerEntity from "../../Entities/Customers";
import Database from "./Database";
import RepositoryException from "../RepositoryException";
import { ParseError } from "../utils/utilFunctions";

export default class CustomerRepository implements ICustomerRepository {
  constructor(
    private db: Database
  ) { }

  private throwsNotFoundError() {
    throw new RepositoryException(400, 'Customer was not found');
  }

  Create(entity: CustomerEntity): Promise<void> {
    try {
      return this.db.knex('customers')
        .insert(entity);
    } catch (error) {
      throw ParseError(error, 'Error on create customer');
    }
  }

  async Update(entity: Partial<CustomerEntity>): Promise<void> {
    try {
      const updatedEntities = await this.db.knex('customers')
        .where({ id: entity.id })
        .update(entity);

      if (updatedEntities === 0)
        this.throwsNotFoundError();
    } catch (error) {
      throw ParseError(error, 'Error on update customer');
    }
  }

  async Show(entityId: number): Promise<CustomerEntity> {
    try {
      const customers = await this.db.knex('customers')
        .where({ id: entityId });

      if (customers.length === 0)
        this.throwsNotFoundError();

      return customers[0];
    } catch (error) {
      throw ParseError(error, 'Error on show customer');
    }
  }

  List(filters?: object, sort?: object[]): Promise<CustomerEntity[]> {
    try {
      return this.db.knex('customers');
    } catch (error) {
      throw ParseError(error, 'Error on list customers');
    }
  }

  async Delete(entityId: number): Promise<void> {
    try {
      const deletedEntities = await this.db.knex('customers')
        .where({ id: entityId })
        .del();

      if (deletedEntities === 0)
        this.throwsNotFoundError();
    } catch (error) {
      throw ParseError(error, 'Error on delete customer');
    }
  }
}