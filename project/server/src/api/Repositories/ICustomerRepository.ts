import IRepository from "./IRepository";
import CustomerEntity from "../Entities/Customers";

export default interface ICustomerRepository extends IRepository<CustomerEntity> {

}
