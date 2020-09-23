import Database from "./Database";
import CustomerRepository from "./CustomerRepository";

export const db = new Database();
export const customerRepository = new CustomerRepository(db);

export default { db, customerRepository };