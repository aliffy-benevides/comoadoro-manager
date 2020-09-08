import request from 'supertest';
import { mock, MockProxy } from 'jest-mock-extended';
import express, { Express } from 'express';

import CustomerEntity from "../../Entities/Customers";
import ICustomerRepository from '../../Repositories/ICustomerRepository';
import CustomerController from './CustomerController';
import RepositoryError from '../../Repositories/RepositoryError';

function throwPromiseError(error: any): Promise<any> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), 1000)
  })
}

describe('The CustomerController', () => {
  let app: Express;

  let mockRepository: MockProxy<ICustomerRepository> & ICustomerRepository;
  let customerController: CustomerController;

  const customerId = 123;
  const validCustomer: CustomerEntity = {
    name: 'test',
    address: 'address test',
    email: 'test@email.com',
    observation: 'XXXXXXX',
    phone: '1500000000'
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
  const notFoundError = new RepositoryError(404, 'Customer was not found');
  const unexpectedError = {
    message: 'Generic Error'
  }

  beforeEach(() => {
    mockRepository = mock<ICustomerRepository>();
    customerController = new CustomerController(mockRepository);

    app = express();
    app.use(express.json());
    app.use(customerController.Path, customerController.Router);
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

    describe('When Repository throw Error', () => {
      test('Should return status 500 and error\'s message', async () => {
        mockRepository.Create.mockImplementation(() => throwPromiseError(unexpectedError));

        const res = await request(app)
          .post(url)
          .send(validCustomer)

        expect(res.status).toBe(500);
        expect(res.body).toMatchObject({
          message: 'Unexpected error on create customer',
          error: unexpectedError
        });
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

    describe('When customer is not found', () => {
      test('Should return status 404 and not found message', async () => {
        mockRepository.Show.mockImplementation(() => throwPromiseError(notFoundError));
        mockRepository.Update.mockImplementation(() => throwPromiseError(notFoundError));

        const res = await request(app)
          .put(validUrl)
          .send(validCustomer)

        expect(res.status).toBe(notFoundError.status);
        expect(res.body).toMatchObject(notFoundError);
      })
    })

    describe('When Repository throw Error', () => {
      test('Should return status 500 and error\'s message', async () => {
        mockRepository.Update.mockImplementation(() => throwPromiseError(unexpectedError));

        const res = await request(app)
          .put(validUrl)
          .send(validCustomer)

        expect(res.status).toBe(500);
        expect(res.body).toMatchObject({
          message: 'Unexpected error on update customer',
          error: unexpectedError
        });
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
      test('Should return status 400 and do not call repository\'s show function', async () => {
        const res = await request(app)
          .get(invalidUrl)

        expect(mockRepository.Show).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid customer\'s id'
        });
      })
    })

    describe('When customer is not found', () => {
      test('Should return status 404 and not found message', async () => {
        mockRepository.Show.mockImplementation(() => throwPromiseError(notFoundError));

        const res = await request(app)
          .get(validUrl)

        expect(res.status).toBe(notFoundError.status);
        expect(res.body).toMatchObject(notFoundError);
      })
    })

    describe('When Repository throw Error', () => {
      test('Should return status 500 and error\'s message', async () => {
        mockRepository.Show.mockImplementation(() => throwPromiseError(unexpectedError));

        const res = await request(app)
          .get(validUrl)

        expect(res.status).toBe(500);
        expect(res.body).toMatchObject({
          message: 'Unexpected error on show customer',
          error: unexpectedError
        });
      })
    })
  })

  describe('GET /customers (LIST)', () => {
    const validUrl = '/customers';

    describe('When everything is OK', () => {
      test('Should return status 200 and the customer\'s list', async () => {
        mockRepository.List.mockReturnValue(new Promise(resolve => resolve(customersList)));

        const res = await request(app)
          .get(validUrl)

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(customersList);
      })
    })

    describe('When Repository throw Error', () => {
      test('Should return status 500 and error\'s message', async () => {
        mockRepository.List.mockImplementation(() => throwPromiseError(unexpectedError));

        const res = await request(app)
          .get(validUrl)

        expect(res.status).toBe(500);
        expect(res.body).toMatchObject({
          message: 'Unexpected error on list customers',
          error: unexpectedError
        });
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

    describe('When customer is not found', () => {
      test('Should return status 404 and not found message', async () => {
        mockRepository.Show.mockImplementation(() => throwPromiseError(notFoundError));
        mockRepository.Delete.mockImplementation(() => throwPromiseError(notFoundError));

        const res = await request(app)
          .delete(validUrl)

        expect(res.status).toBe(notFoundError.status);
        expect(res.body).toMatchObject({
          message: 'Customer was not found'
        });
      })
    })

    describe('When Repository throw Error', () => {
      test('Should return status 500 and error\'s message', async () => {
        mockRepository.Delete.mockImplementation(() => throwPromiseError(unexpectedError));

        const res = await request(app)
          .delete(validUrl)

        expect(res.status).toBe(500);
        expect(res.body).toMatchObject({
          message: 'Unexpected error on delete customer',
          error: unexpectedError
        });
      })
    })
  })
})
