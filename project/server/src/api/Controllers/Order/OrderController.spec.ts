import request from 'supertest';
import { mock, MockProxy } from 'jest-mock-extended';
import { Express } from 'express';

import OrderController from './OrderController';
import { FullOrderEntity } from '../../Entities/Orders';
import { FullProductEntity } from '../../Entities/Products';
import IOrderRepository from '../../Repositories/IOrderRepository';
import ICustomerRepository from '../../Repositories/ICustomerRepository';
import IProductRepository from '../../Repositories/IProductRepository';

import { initializeServerWithController, testWhenRepoThrowsError } from '../../../../test/testHelpers';
import ApiException from '../../ApiException';
import CustomerEntity from '../../Entities/Customers';

describe('The OrderController', () => {
  let app: Express;

  let mockRepository: MockProxy<IOrderRepository>;
  let mockCustomerRepository: MockProxy<ICustomerRepository>;
  let mockProductRepository: MockProxy<IProductRepository>;
  let orderController: OrderController;

  const baseUrl = '/orders';
  const orderId = 123;
  const validOrder: FullOrderEntity = {
    customer_id: 2,
    status: 'Registered',
    order_date: new Date().toISOString(),
    delivery_date: new Date().toISOString(),
    discount: 5.00,
    shipping: 4.50,
    observation: '',
    customer: {
      id: 2,
      name: 'Name',
      email: 'email',
      address: 'Address',
      phone: '15000000000',
      observation: 'aaaaa'
    },
    items: []
  }
  const validOrderWithInvalidAttributes = {
    ...validOrder,
    invalidAttr: 'Invalid'
  }

  const validOrderMissingDiscountAndShipping: FullOrderEntity = {
    ...validOrder,
    discount: undefined,
    shipping: undefined
  } as any

  // const ordersList: FullOrderEntity[] = [
  //   validOrder, validOrder, validOrder
  // ]
  const invalidOrder = {
    wrongProp: 'XXXX'
  }

  const validOrderWithInvalidItems: FullOrderEntity = {
    ...validOrder,
    items: [{
      wrongProp: 'XXXX'
    } as any]
  }

  const itemPrice = 25.00;
  const validPackedProduct: FullProductEntity = {
    id: 1, is_packed: true,
    name: 'Packed Product', description: 'aaa', is_activated: true,
    unit_cost: 4.50, unit_price: null, category_id: 5,

    category: {} as any, features: [], packings: [{
      id: 10,
      name: 'Packing 1', cost: 2, size: 0.5, unit: 'Kilograma', unit_abbreviation: 'kg',
      productPacking: {
        product_id: 1, packing_id: 10, price: itemPrice, quantity: 15
      }
    }]
  }
  const validOrderWithValidPackedItems: FullOrderEntity = {
    ...validOrder,
    items: [{
      product_id: 1, packing_id: 10,
      amount: 5
    } as any]
  }
  const validOrderWithValidPackedItemsWithPrices: FullOrderEntity = {
    ...validOrder,
    items: [{
      product_id: 1, packing_id: 10,
      amount: 5, unit_price: itemPrice
    } as any]
  }
  // const validPackedProductWithDecreseadPackingQuantity: FullProductEntity = {
  //   ...validPackedProduct,
  //   packings: [{
  //     id: 10,
  //     name: 'Packing 1', cost: 2, size: 0.5, unit: 'Kilograma', unit_abbreviation: 'kg',
  //     productPacking: {
  //       product_id: 1, packing_id: 10, price: itemPrice, quantity: 10
  //     }
  //   }]
  // }

  const productPrice = 16.00;
  const validUnpackedProduct: FullProductEntity = {
    id: 2, is_packed: false,
    name: 'Unpacked Product', description: 'aaa', is_activated: true,
    unit_cost: 4.50, unit_price: productPrice, category_id: 5,

    category: {} as any, features: [], packings: []
  }
  const validOrderWithValidUnpackedItems: FullOrderEntity = {
    ...validOrder,
    items: [{
      product_id: 2, packing_id: null,
      amount: 5
    } as any]
  }
  const validOrderWithValidUnpackedItemsWithPrices: FullOrderEntity = {
    ...validOrder,
    items: [{
      product_id: 2, packing_id: null,
      amount: 5, unit_price: productPrice
    } as any]
  }

  function setupGetOrListOrders(): { order: FullOrderEntity, orders: FullOrderEntity[] } {
    const fullOrder: FullOrderEntity = {
      customer_id: 45,
      status: 'Registered',
      order_date: new Date().toISOString(),
      delivery_date: new Date().toISOString(),
      discount: 5.00,
      shipping: 4.50,
      observation: '',
      customer: {
        id: 45,
        name: 'Name',
        email: 'email',
        address: 'Address',
        phone: '15000000000',
        observation: 'aaaaa'
      },
      items: [{
        id: 1,
        product_id: 1, packing_id: 10,
        amount: 5, unit_price: 25.00,
        product: {
          id: 1, name: 'Product 1', category_id: 999, description: 'aaa',
          is_activated: true, is_packed: true, unit_cost: 15.00, unit_price: null
        },
        packing: {
          id: 10,
          name: 'Packing 1', cost: 5.00, size: 500, unit: 'gramas', unit_abbreviation: 'g'
        }
      }, {
        id: 2,
        product_id: 5, packing_id: null,
        amount: 5, unit_price: 16.00,
        product: {
          id: 5, name: 'Product 5', category_id: 999, description: 'aaa',
          is_activated: true, is_packed: false, unit_cost: 15.00, unit_price: 45.00
        }
      }]
    }

    mockRepository.Show.mockResolvedValue({ ...fullOrder, customer: undefined, items: fullOrder.items.map(item => ({ ...item, product: undefined, packing: undefined })) });
    mockRepository.List.mockResolvedValue([
      { ...fullOrder, customer: undefined, items: fullOrder.items.map(item => ({ ...item, product: undefined, packing: undefined })) },
      { ...fullOrder, customer: undefined, items: fullOrder.items.map(item => ({ ...item, product: undefined, packing: undefined })) }
    ]);
    mockCustomerRepository.Show.mockImplementation(customerId => {
      if (customerId !== fullOrder.customer?.id)
        throw new ApiException(404, 'Customer not found');
      return fullOrder.customer as any;
    });
    mockCustomerRepository.List.mockResolvedValue([fullOrder.customer as CustomerEntity]);
    mockProductRepository.Show.mockImplementation(productId => {
      const product = fullOrder.items.map(item => item.product).find(product => product?.id === productId);
      if (!product)
        throw new ApiException(404, 'Product not found');

      return Promise.resolve({
        ...product,
        category: {} as any,
        features: [],
        packings: []
      });
    });
    mockProductRepository.List.mockResolvedValue(fullOrder.items.map(item => item.product).map(product => ({
      ...product,
      category: {} as any,
      features: [],
      packings: []
    })) as any[]);
    mockProductRepository.ListPackings.mockResolvedValue(fullOrder.items.map(item => item.packing).filter(packing => !!packing) as any);

    return { order: fullOrder, orders: [fullOrder, fullOrder] };
  }

  function setupPostOrUpdateOrderWithItems(product: FullProductEntity) {
    mockProductRepository.Show.mockResolvedValue(product);
    mockProductRepository.List.mockResolvedValue([product]);
    mockProductRepository.ListPackings.mockResolvedValue([{
      id: 10,
      name: 'Packing 1', cost: 5.00, size: 500, unit: 'gramas', unit_abbreviation: 'g'
    }]);
  }

  beforeEach(() => {
    mockRepository = mock<IOrderRepository>();
    mockCustomerRepository = mock<ICustomerRepository>();
    mockProductRepository = mock<IProductRepository>();
    orderController = new OrderController(mockRepository, mockCustomerRepository, mockProductRepository);

    app = initializeServerWithController(orderController);
  });

  describe(`POST ${baseUrl} (CREATE)`, () => {
    const url = baseUrl;

    describe('When send a valid order', () => {
      test('Should return status 201 and call repository\'s create function', async () => {
        const res = await request(app)
          .post(url)
          .send(validOrder)

        expect(res.status).toBe(201);
        expect(mockRepository.Create).toHaveBeenCalledWith(validOrder);
      })
    })

    describe('When send a valid order with another attributes', () => {
      test('Should return status 201 and call repository\'s create function with just valid attributes', async () => {
        const res = await request(app)
          .post(url)
          .send(validOrderWithInvalidAttributes)

        expect(res.status).toBe(201);
        expect(mockRepository.Create).toHaveBeenCalledWith(validOrder);
      })
    })

    describe('When send a valid order missing discount and/or shipping', () => {
      test('Should return status 201 and call repository\'s create function with 0 in these attributes', async () => {
        const res = await request(app)
          .post(url)
          .send(validOrderMissingDiscountAndShipping)

        expect(res.status).toBe(201);
        expect(mockRepository.Create).toHaveBeenCalledWith({ ...validOrderMissingDiscountAndShipping, discount: 0, shipping: 0 });
      })
    })

    describe('When send a invalid order', () => {
      test('Should return status 400 and do not call repository\'s create function', async () => {
        const res = await request(app)
          .post(url)
          .send(invalidOrder)

        expect(mockRepository.Create).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Invalid order'
        });
      })
    })

    describe('When send without order', () => {
      test('Should return status 400 and do not call repository\'s create function', async () => {
        const res = await request(app)
          .post(url)
          .send()

        expect(mockRepository.Create).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Order not provided'
        });
      })
    })

    describe('When send a valid order, but with invalid items', () => {
      test('Should return status 400 and do not call repository\'s create function', async () => {
        const res = await request(app)
          .post(url)
          .send(validOrderWithInvalidItems)

        expect(mockRepository.Create).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Order with invalid items'
        });
      })
    })

    describe('When send a order with items without packing_id, but the product is packed', () => {
      test('Should return status 400 and do not call repository\'s create function', async () => {
        setupPostOrUpdateOrderWithItems(validPackedProduct);

        const res = await request(app)
          .post(url)
          .send(validOrderWithValidUnpackedItems)

        expect(mockRepository.Create).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Order with invalid items',
          detail: 'Items without packing_id, but the product is packed'
        });
      })
    })

    describe('When send a order with valid unpacked items', () => {
      test('Should return status 201 and call repository\'s create function with order\' items filled with their prices', async () => {
        setupPostOrUpdateOrderWithItems(validUnpackedProduct);

        const res = await request(app)
          .post(url)
          .send(validOrderWithValidUnpackedItems)

        expect(mockRepository.Create).toHaveBeenCalledWith(validOrderWithValidUnpackedItemsWithPrices);
        expect(res.status).toBe(201);
      })
    })

    describe('When send a order with valid packed items', () => {
      test('Should return status 201 and call repository\'s create function with order\' items filled with their prices', async () => {
        setupPostOrUpdateOrderWithItems(validPackedProduct);

        const res = await request(app)
          .post(url)
          .send(validOrderWithValidPackedItems)

        expect(mockRepository.Create).toHaveBeenCalledWith(validOrderWithValidPackedItemsWithPrices);
        expect(res.status).toBe(201);
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        await testWhenRepoThrowsError(app, url, 'post', mockRepository.Create, undefined, validOrder);
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        await testWhenRepoThrowsError(app, url, 'post', mockRepository.Create, 'Unexpected error on create order', validOrder);
      })
    })
  })

  describe(`PUT ${baseUrl}/:orderId (UPDATE)`, () => {
    const validUrl = `${baseUrl}/${orderId}`;
    const invalidUrl = `${baseUrl}/aaa`;

    describe('When send with a invalid order\'s id', () => {
      test('Should return status 404 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(invalidUrl)
          .send(validOrder)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid order\'s id'
        });
      })
    })

    describe('When send a valid order', () => {
      test('Should return status 201 and call repository\'s update function', async () => {
        const res = await request(app)
          .put(validUrl)
          .send(validOrder)

        expect(res.status).toBe(201);
        expect(mockRepository.Update).toHaveBeenCalledWith({ ...validOrder, id: orderId });
      })
    })

    describe('When send a valid order with another attributes', () => {
      test('Should return status 201 and call repository\'s update function with just valid attributes', async () => {
        const res = await request(app)
          .put(validUrl)
          .send(validOrderWithInvalidAttributes)

        expect(res.status).toBe(201);
        expect(mockRepository.Update).toHaveBeenCalledWith({ ...validOrder, id: orderId });
      })
    })

    describe('When send a valid order missing discount and/or shipping', () => {
      test('Should return status 201 and call repository\'s update function with 0 in these attributes', async () => {
        const res = await request(app)
          .put(validUrl)
          .send(validOrderMissingDiscountAndShipping)

        expect(res.status).toBe(201);
        expect(mockRepository.Update).toHaveBeenCalledWith({ ...validOrderMissingDiscountAndShipping, discount: 0, shipping: 0, id: orderId });
      })
    })

    describe('When send a invalid order', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(validUrl)
          .send(invalidOrder)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Invalid order'
        });
      })
    })

    describe('When send without order', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(validUrl)
          .send()

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Order not provided'
        });
      })
    })

    describe('When send a valid order, but with invalid items', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(validUrl)
          .send(validOrderWithInvalidItems)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Order with invalid items'
        });
      })
    })

    describe('When send a order with items without packing_id, but the product is packed', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        setupPostOrUpdateOrderWithItems(validPackedProduct);

        const res = await request(app)
          .put(validUrl)
          .send(validOrderWithValidUnpackedItems)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'Order with invalid items',
          detail: 'Items without packing_id, but the product is packed'
        });
      })
    })

    describe('When send a order with valid unpacked items', () => {
      test('Should return status 201 and call repository\'s update function with order\' items filled with their prices', async () => {
        setupPostOrUpdateOrderWithItems(validUnpackedProduct);

        const res = await request(app)
          .put(validUrl)
          .send(validOrderWithValidUnpackedItems)

        expect(mockRepository.Update).toHaveBeenCalledWith({ ...validOrderWithValidUnpackedItemsWithPrices, id: orderId });
        expect(res.status).toBe(201);
      })
    })

    describe('When send a order with valid packed items', () => {
      test('Should return status 201 and call repository\'s update function with order\' items filled with their prices', async () => {
        setupPostOrUpdateOrderWithItems(validPackedProduct);

        const res = await request(app)
          .put(validUrl)
          .send(validOrderWithValidPackedItems)

        expect(mockRepository.Update).toHaveBeenCalledWith({ ...validOrderWithValidPackedItemsWithPrices, id: orderId });
        expect(res.status).toBe(201);
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update, undefined, validOrder);
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update, 'Unexpected error on update order', validOrder);
      })
    })
  })

  describe(`GET ${baseUrl}/:orderId (SHOW)`, () => {
    const validUrl = `${baseUrl}/${orderId}`;
    const invalidUrl = `${baseUrl}/aaa`;

    describe('When send a valid order\'s id', () => {
      test('Should return status 200 and the order', async () => {
        const { order } = setupGetOrListOrders();

        const res = await request(app)
          .get(validUrl)

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(order);
      })
    })

    describe('When send with a invalid order\'s id', () => {
      test('Should return status 404 and do not call repository\'s show function', async () => {
        const res = await request(app)
          .get(invalidUrl)

        expect(mockRepository.Show).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid order\'s id'
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
        await testWhenRepoThrowsError(app, validUrl, 'get', mockRepository.Show, 'Unexpected error on show order');
      })
    })
  })

  describe(`GET ${baseUrl} (LIST)`, () => {
    const url = baseUrl;

    describe('When everything is OK', () => {
      test('Should return status 200 and the order\'s list', async () => {
        const { orders } = setupGetOrListOrders();

        const res = await request(app)
          .get(url)

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(orders);
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        await testWhenRepoThrowsError(app, url, 'get', mockRepository.List)
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        await testWhenRepoThrowsError(app, url, 'get', mockRepository.List, 'Unexpected error on list orders');
      })
    })
  })

  describe(`DELETE ${baseUrl}/:orderId (DELETE)`, () => {
    const validUrl = `${baseUrl}/${orderId}`;
    const invalidUrl = `${baseUrl}/aaa`;

    describe('When send a valid order\'s id', () => {
      test('Should return status 200 and call repository\'s delete function', async () => {
        const res = await request(app)
          .delete(validUrl)

        expect(mockRepository.Delete).toHaveBeenCalledWith(orderId);
        expect(res.status).toBe(201);
      })
    })

    describe('When send with a invalid order\'s id', () => {
      test('Should return status 404 and do not call repository\'s delete function', async () => {
        const res = await request(app)
          .delete(invalidUrl)

        expect(mockRepository.Delete).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid order\'s id'
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
        await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.Delete, 'Unexpected error on delete order');
      })
    })
  })

  describe(`PUT ${baseUrl}/:orderId/finish (Finish order)`, () => {
    const validUrl = `${baseUrl}/${orderId}/finish`;
    const invalidUrl = `${baseUrl}/aaa/finish`;

    describe('When send a valid order\'s id', () => {
      test('Should return status 200 and call repository\'s update function', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Registered' })));

        const res = await request(app)
          .put(validUrl)

        expect(mockRepository.Update).toHaveBeenCalledWith({ id: orderId, status: 'Finished' });
        expect(res.status).toBe(201);
      })
    })

    describe('When send with a invalid order\'s id', () => {
      test('Should return status 404 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(invalidUrl)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid order\'s id'
        });
      })
    })

    describe('When the order is already finished', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Finished' })));

        const res = await request(app)
          .put(validUrl)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'The order is already finished'
        })
      })
    })

    describe('When the order is already canceled', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Canceled' })));

        const res = await request(app)
          .put(validUrl)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'The order is already canceled'
        })
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Registered' })));
        await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update)
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Registered' })));
        await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update, 'Unexpected error on finish order');
      })
    })
  })

  describe(`PUT ${baseUrl}/:orderId/cancel (Cancel order)`, () => {
    const validUrl = `${baseUrl}/${orderId}/cancel`;
    const invalidUrl = `${baseUrl}/aaa/cancel`;

    describe('When send a valid order\'s id', () => {
      test('Should return status 200 and call repository\'s update function', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Registered' })));

        const res = await request(app)
          .put(validUrl)

        expect(mockRepository.Update).toHaveBeenCalledWith({ id: orderId, status: 'Canceled' });
        expect(res.status).toBe(201);
      })
    })

    describe('When send with a invalid order\'s id', () => {
      test('Should return status 404 and do not call repository\'s update function', async () => {
        const res = await request(app)
          .put(invalidUrl)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(404);
        expect(res.body).toMatchObject({
          message: 'Invalid order\'s id'
        });
      })
    })

    describe('When the order is already finished', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Finished' })));

        const res = await request(app)
          .put(validUrl)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'The order is already finished'
        })
      })
    })

    describe('When the order is already canceled', () => {
      test('Should return status 400 and do not call repository\'s update function', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Canceled' })));

        const res = await request(app)
          .put(validUrl)

        expect(mockRepository.Update).not.toHaveBeenCalled();
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({
          message: 'The order is already canceled'
        })
      })
    })

    describe('When repository throws an expected error', () => {
      test('Should return error\'s status and error\'s message', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Registered' })));
        await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update)
      })
    })

    describe('When repository throws an unexpected error', () => {
      test('Should return status 500 and error\'s message', async () => {
        mockRepository.Show.mockReturnValue(new Promise(resolve => resolve({ ...validOrder, id: orderId, status: 'Registered' })));
        await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update, 'Unexpected error on cancel order');
      })
    })
  })

  describe(`GET ${baseUrl}/status (List Order Status)`, () => {
    const url = `${baseUrl}/status`;

    test('Should return order\'s status', async () => {
      const res = await request(app)
        .get(url)

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body instanceof Array) {
        expect(res.body.length).toBeGreaterThan(0);
        // test if all items inside array are a string
        expect(res.body.filter(a => typeof a !== 'string').length).toBe(0);
      }
    })
  })
})