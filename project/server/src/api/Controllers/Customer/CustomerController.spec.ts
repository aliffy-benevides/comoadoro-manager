import request from 'supertest';
import { mock, MockProxy } from 'jest-mock-extended';
import { Express } from 'express';

import CustomerEntity from "../../Entities/Customers";
import ICustomerRepository from '../../Repositories/ICustomerRepository';
import CustomerController from './CustomerController';

import { initializeServerWithController, testWhenRepoThrowsError } from '../../../../test/testHelpers';

describe('The CustomerController', () => {
  let app: Express;

  let mockRepository: MockProxy<ICustomerRepository>;
  let customerController: CustomerController;

  const customerId = 123;
  const validCustomer: CustomerEntity = {
    name: 'test',
    address: 'address test',
    email: 'test@email.com',
    observation: 'XXXXXXX',
    phone: '1500000000'
  }
  const validCustomerWithInvalidAttributes = {
    ...validCustomer,
    invalidAttr: 'Invalid'
  }
  const validCustomerWithId: CustomerEntity = {
    ...validCustomer,
    id: customerId
  }
  const customersList: CustomerEntity[] = [
    validCustomerWithId, validCustomerWithId, validCustomerWithId
  ]
  const invalidCustomer = {
    wrongProp: 'XXXX'
  }

  beforeEach(() => {
    mockRepository = mock<ICustomerRepository>();
    customerController = new CustomerController(mockRepository);

    app = initializeServerWithController(customerController);
  });

  describe('POST /customers (CREATE)', () => {
    const url = '/customers'

    describe('With a valid customer', () => {
      test('Should return status 201 and call repository\'s create function', async () => {
        const res = await request(app)
          .post(url)
          .send(validCustomer)

        expect(mockRepository.Create).toHaveBeenCalledWith(validCustomer);
        expect(res.status).toBe(201);
      })
    })

    describe('With a valid customer with invalid Attributes', () => {
      test('Should return status 201 and call repository\'s create function with just valid attributes', async () => {
        const res = await request(app)
          .post(url)
          .send(validCustomerWithInvalidAttributes)

        expect(mockRepository.Create).toHaveBeenCalledWith(validCustomer);
        expect(res.status).toBe(201);
      })
    })

    describe('With a invalid customer', () => {
      test('Should return status 400 and do not call repository\'s create function', async () => {
        const res = await request(app)
          .post(url)
          .send(invalidCustomer)

        expect(mockRepository.Create).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Invalid customer'
        });
      })
    })

    describe('Without customer', () => {
      test('Should return status 400 and do not call repository\'s create function', async () => {
        const res = await request(app)
          .post(url)
          .send()

        expect(mockRepository.Create).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Customer not provided'
        });
      })
    })
    
    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        await testWhenRepoThrowsError(app, url, 'post', mockRepository.Create, undefined, validCustomer);
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        await testWhenRepoThrowsError(app, url, 'post', mockRepository.Create, 'Unexpected error on create customer', validCustomer);
      })
    })
  })

  describe('PUT /customers/:customerId (UPDATE)', () => {
    const validUrl = `/customers/${customerId}`;
    const invalidUrl = '/customers/aaa';

    describe('With a valid customer', () => {
      test('Should return status 201 and call repository\'s update function', async () => {
        const res = await request(app)
          .put(validUrl)
          .send(validCustomer)

        expect(mockRepository.Update).toHaveBeenCalledWith(validCustomerWithId);
        expect(res.status).toBe(201);
      })
    })

    describe('With a valid customer with invalid attributes', () => {
      test('Should return status 201 and call repository\'s update function with just valid attributes', async () => {
        const res = await request(app)
          .put(validUrl)
          .send(validCustomerWithInvalidAttributes)

        expect(mockRepository.Update).toHaveBeenCalledWith(validCustomerWithId);
        expect(res.status).toBe(201);
      })
    })

    describe('With a invalid customer', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(validUrl)
          .send(invalidCustomer)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Invalid customer'
        });
      })
    })

    describe('Without customer', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(validUrl)
          .send()

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Customer not provided'
        });
      })
    })

    describe('With a invalid customer\'s id', () => {
      test('Should return status 404 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(invalidUrl)
          .send(validCustomer)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid customer\'s id'
        });
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update, undefined, validCustomer);
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update, 'Unexpected error on update customer', validCustomer);
      })
    })
  })

  describe('GET /customers/:customerId (SHOW)', () => {
    const validUrl = `/customers/${customerId}`;
    const invalidUrl = '/customers/aaa';

    describe('With a valid customer\'s id', () => {
      test('Should return status 200 and the customer', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve(validCustomerWithId)));

        const res = await request(app)
          .get(validUrl)

        expect(mockRepository.Show).toHaveBeenCalledWith(customerId);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(validCustomerWithId);
      })
    })

    describe('With a invalid customer\'s id', () => {
      test('Should return status 404 and do not call repository\'s show function', async () => {
        const res = await request(app)
          .get(invalidUrl)

        expect(mockRepository.Show).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid customer\'s id'
        });
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        await testWhenRepoThrowsError(app, validUrl, 'get', mockRepository.Show)
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        await testWhenRepoThrowsError(app, validUrl, 'get', mockRepository.Show, 'Unexpected error on show customer');
      })
    })
  })

  describe('GET /customers (LIST)', () => {
    const url = '/customers';

    describe('When everything is OK', () => {
      test('Should return status 200 and the customer\'s list', async () => {
        mockRepository.List.mockReturnValue(new Promise(resolve => resolve(customersList)));

        const res = await request(app)
          .get(url)

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(customersList);
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        await testWhenRepoThrowsError(app, url, 'get', mockRepository.List)
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        await testWhenRepoThrowsError(app, url, 'get', mockRepository.List, 'Unexpected error on list customers');
      })
    })
  })

  describe('DELETE /customers/:customerId (DELETE)', () => {
    const validUrl = `/customers/${customerId}`;
    const invalidUrl = '/customers/aaa';

    describe('With a valid customer\'s id', () => {
      test('Should return status 201 and call repository\'s delete function', async () => {
        const res = await request(app)
          .delete(validUrl)

        expect(mockRepository.Delete).toHaveBeenCalledWith(customerId);
        expect(res.status).toBe(201);
      })
    })

    describe('With a invalid customer\'s id', () => {
      test('Should return status 404 and do not call repository\'s delete function', async () => {
        const res = await request(app)
          .delete(invalidUrl)

        expect(mockRepository.Delete).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid customer\'s id'
        });
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.Delete)
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.Delete, 'Unexpected error on delete customer');
      })
    })
  })
})
