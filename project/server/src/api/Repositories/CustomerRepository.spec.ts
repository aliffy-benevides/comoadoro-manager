import CustomerEntity from '../Entities/Customers';
import ICustomerRepository from './ICustomerRepository';
import IDatabase from './IDatabase';

import RepositoryException from './RepositoryException';

import { db as knexDb, customerRepository as knexRepo } from './knex';

interface TestRepo {
  name: string;
  repo: ICustomerRepository,
  db: IDatabase
}

const testRepos: TestRepo[] = [
  { name: 'Knex Repository', repo: knexRepo, db: knexDb },
]

describe('CustomerRepository', () => {
  testRepos.forEach(testRepo => {
    describe(testRepo.name, () => {
      beforeAll(() => {
        return testRepo.db.Teardown();
      });

      beforeEach(() => {
        return testRepo.db.Setup();
      });

      afterEach(() => {
        return testRepo.db.Teardown();
      });

      const validCustomer: CustomerEntity = {
        name: 'Customer name',
        address: 'Customer address',
        email: 'name@email.com',
        observation: 'obs',
        phone: '999999999999'
      }

      async function initDatabaseWithCustomers(returnWithIds: boolean = true) {
        let customer1 = { ...validCustomer, name: 'customer1' };
        let customer2 = { ...validCustomer, name: 'customer2' };

        await testRepo.repo.Create(customer1);
        await testRepo.repo.Create(customer2);

        if (returnWithIds) {
          const customers = await testRepo.repo.List();
          const customer1Id = customers.find(c => c.name === customer1.name)?.id;
          const customer2Id = customers.find(c => c.name === customer2.name)?.id;
          customer1 = { ...customer1, id: customer1Id }
          customer2 = { ...customer2, id: customer2Id }
        }

        return { customer1, customer2 };
      }

      describe('When create customer', () => {
        test('Should create a customer', async () => {
          const intialCustomers = await testRepo.repo.List();
          await testRepo.repo.Create(validCustomer);
          const actualCustomers = await testRepo.repo.List();

          expect(intialCustomers.length).toBe(0);
          expect(actualCustomers.length).toBe(1);
          expect(actualCustomers[0]).toMatchObject(validCustomer);
        })
      })

      describe('When update customer', () => {
        describe('and it is an entire found customer', () => {
          test('Should update only the customer', async () => {
            const { customer1, customer2 } = await initDatabaseWithCustomers();

            const updatedCustomer: CustomerEntity = { ...customer1, address: 'Updated address' };

            await testRepo.repo.Update(updatedCustomer);
            const actualCustomers = await testRepo.repo.List();

            expect(actualCustomers.length).toBe(2);
            expect(actualCustomers).toEqual(expect.arrayContaining([
              expect.objectContaining(updatedCustomer),
              expect.objectContaining(customer2)
            ]));
          })
        })

        describe('and it is an partial found customer', () => {
          test('Should update only the customer', async () => {
            const { customer1, customer2 } = await initDatabaseWithCustomers();

            const updatedCustomer: Partial<CustomerEntity> = { address: 'Updated address', id: customer1.id };

            await testRepo.repo.Update(updatedCustomer);
            const actualCustomers = await testRepo.repo.List();

            expect(actualCustomers.length).toBe(2);
            expect(actualCustomers).toEqual(expect.arrayContaining([
              expect.objectContaining({ ...customer1, ...updatedCustomer }),
              expect.objectContaining(customer2)
            ]));
          })
        })

        describe('and it is a not found customer', () => {
          test('Should throws a not found exception', async () => {
            const updatedCustomer: Partial<CustomerEntity> = { name: 'Not found customer', id: 1 };

            expect(testRepo.repo.Update(updatedCustomer))
              .rejects
              .toEqual(new RepositoryException(400, 'Customer was not found'));
          })
        })
      })

      describe('When list customers', () => {
        test('Should return customers list', async () => {
          const initialList = await testRepo.repo.List();
          const { customer1, customer2 } = await initDatabaseWithCustomers(false);
          const actualList = await testRepo.repo.List();

          expect(Array.isArray(initialList)).toBe(true);
          expect(Array.isArray(actualList)).toBe(true);
          expect(initialList.length).toBe(0);
          expect(actualList).toEqual(expect.arrayContaining([
            expect.objectContaining({ ...customer1 }),
            expect.objectContaining({ ...customer2 })
          ]))
        })
      })

      describe('When show customer', () => {
        describe('and it is a found customer', () => {
          test('Should return the customer', async () => {
            const { customer1 } = await initDatabaseWithCustomers(true);

            const customer = await testRepo.repo.Show(customer1.id as number);

            expect(customer).toMatchObject(customer1);
          })
        })

        describe('and it is a not found customer', () => {
          test('Should throws a not found exception', async () => {
            expect(testRepo.repo.Show(1))
              .rejects
              .toEqual(new RepositoryException(400, 'Customer was not found'));
          })
        })
      })

      describe('When delete customer', () => {
        describe('and it is a found customer', () => {
          test('Should the customer have not been in repository anymore', async () => {
            const { customer1 } = await initDatabaseWithCustomers(true);

            await testRepo.repo.Delete(customer1.id as number);
            const customers = await testRepo.repo.List();

            expect(customers).toEqual(
              expect.not.arrayContaining([expect.objectContaining(customer1)])
            );
          })
        })

        describe('and it is a not found customer', () => {
          test('Should throws a not found exception', async () => {
            expect(testRepo.repo.Delete(1))
              .rejects
              .toEqual(new RepositoryException(400, 'Customer was not found'));
          })
        })
      })
    })
  })
})