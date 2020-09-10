import request from 'supertest';
import { mock, MockProxy } from 'jest-mock-extended';
import { Express } from 'express';

import IProductRepository from '../../Repositories/IProductRepository';
import ProductController from './ProductController';
import { FullProductEntity, CategoryEntity, PackingEntity, FeatureEntity } from '../../Entities/Products';

import { initializeServerWithController, testWhenRepoThrowsError } from '../../../../test/testHelpers';

describe('The ProductController', () => {
  let app: Express;

  let mockRepository: MockProxy<IProductRepository>;
  let productController: ProductController;

  beforeEach(() => {
    mockRepository = mock<IProductRepository>();
    productController = new ProductController(mockRepository);

    app = initializeServerWithController(productController);
  });

  describe('Products', () => {
    //#region Variables
    const baseUrl = '/products';

    const entityId: number = 123;
    const validEntity: FullProductEntity = {
      name: 'Name',
      description: 'Description',
      is_packed: true,
      unit_cost: 5.46,
      unit_price: null,
      category_id: 5,
      is_activated: true,
      category: {
        name: 'Category name',
        image_url: 'http://image_url.png'
      },
      features: [],
      packings: []
    };

    const validEntityWithInvalidAttributes = {
      ...validEntity,
      invalidAttr: 'Invalid'
    };

    const invalidEntity = {
      wrongAttr: 'Invalid'
    };

    const validEntityWithId: FullProductEntity = {
      ...validEntity,
      id: entityId
    }

    const entitiesList: FullProductEntity[] = [
      validEntity, validEntity, validEntity
    ]
    //#endregion

    describe(`POST ${baseUrl} (CREATE)`, () => {
      const url = baseUrl;

      describe('When send a valid product', () => {
        test('Should return status 201 and call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send(validEntity)

          expect(res.status).toBe(201);
          expect(mockRepository.Create).toHaveBeenCalledWith(validEntity);
        })
      })

      describe('When send a valid product with another attributes', () => {
        test('Should return status 201 and call repository\'s create function with just valid attributes', async () => {
          const res = await request(app)
            .post(url)
            .send(validEntityWithInvalidAttributes)

          expect(res.status).toBe(201);
          expect(mockRepository.Create).toHaveBeenCalledWith(validEntity);
        })
      })

      describe('When send a invalid product', () => {
        test('Should return status 400 and do not call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send(invalidEntity)

          expect(mockRepository.Create).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Invalid product'
          });
        })
      })

      describe('When send without product', () => {
        test('Should return status 400 and do not call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send()

          expect(mockRepository.Create).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Product not provided'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'post', mockRepository.Create, undefined, validEntity);
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'post', mockRepository.Create, 'Unexpected error on create product', validEntity);
        })
      })
    })

    describe(`PUT ${baseUrl}/:productId (UPDATE)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid product', () => {
        test('Should return status 201 and call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(validEntity)

          expect(res.status).toBe(201);
          expect(mockRepository.Update).toHaveBeenCalledWith(validEntityWithId);
        })
      })

      describe('When send a valid product with another attributes', () => {
        test('Should return status 201 and call repository\'s update function with just valid attributes', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(validEntityWithInvalidAttributes)

          expect(res.status).toBe(201);
          expect(mockRepository.Update).toHaveBeenCalledWith(validEntityWithId);
        })
      })

      describe('When send a invalid product', () => {
        test('Should return status 400 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(invalidEntity)

          expect(mockRepository.Update).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Invalid product'
          });
        })
      })

      describe('When send without product', () => {
        test('Should return status 400 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send()

          expect(mockRepository.Update).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Product not provided'
          });
        })
      })

      describe('When send with a invalid product\'s id', () => {
        test('Should return status 404 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(invalidUrl)
            .send(validEntity)

          expect(mockRepository.Update).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid product\'s id'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update, undefined, validEntity);
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.Update, 'Unexpected error on update product', validEntity);
        })
      })
    })

    describe(`GET ${baseUrl}/:productId (SHOW)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid product\'s id', () => {
        test('Should return status 200 and the product', async () => {
          mockRepository.Show.mockReturnValue(new Promise(resolve => resolve(validEntityWithId)));

          const res = await request(app)
            .get(validUrl)

          expect(mockRepository.Show).toHaveBeenCalledWith(entityId);
          expect(res.status).toBe(200);
          expect(res.body).toMatchObject(validEntityWithId);
        })
      })

      describe('When send with a invalid product\'s id', () => {
        test('Should return status 404 and do not call repository\'s show function', async () => {
          const res = await request(app)
            .get(invalidUrl)

          expect(mockRepository.Show).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid product\'s id'
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
          await testWhenRepoThrowsError(app, validUrl, 'get', mockRepository.Show, 'Unexpected error on show product');
        })
      })
    })

    describe(`GET ${baseUrl} (LIST)`, () => {
      const url = baseUrl;

      describe('When everything is OK', () => {
        test('Should return status 200 and the product\'s list', async () => {
          mockRepository.List.mockReturnValue(new Promise(resolve => resolve(entitiesList)));

          const res = await request(app)
            .get(url)

          expect(res.status).toBe(200);
          expect(res.body).toMatchObject(entitiesList);
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'get', mockRepository.List)
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'get', mockRepository.List, 'Unexpected error on list products');
        })
      })
    })

    describe(`DELETE ${baseUrl}/:productId (DELETE)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid product\'s id', () => {
        test('Should return status 200 and call repository\'s delete function', async () => {
          const res = await request(app)
            .delete(validUrl)

          expect(mockRepository.Delete).toHaveBeenCalledWith(entityId);
          expect(res.status).toBe(201);
        })
      })

      describe('When send with a invalid product\'s id', () => {
        test('Should return status 404 and do not call repository\'s show function', async () => {
          const res = await request(app)
            .delete(invalidUrl)

          expect(mockRepository.Delete).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid product\'s id'
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
          await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.Delete, 'Unexpected error on delete product');
        })
      })
    })
  })

  describe('Packings', () => {
    //#region Variables
    const baseUrl = '/products/packings';

    const entityId: number = 123;
    const validEntity: PackingEntity = {
      name: 'Name',
      cost: 23.95,
      size: 500,
      unit: 'gramas',
      unit_abbreviation: 'g'
    };

    const validEntityWithInvalidAttributes = {
      ...validEntity,
      invalidAttr: 'Invalid'
    };

    const invalidEntity = {
      wrongAttr: 'Invalid'
    };

    const validEntityWithId: PackingEntity = {
      ...validEntity,
      id: entityId
    }

    const entitiesList: PackingEntity[] = [
      validEntity, validEntity, validEntity
    ]
    //#endregion

    describe(`POST ${baseUrl} (CREATE)`, () => {
      const url = baseUrl;

      describe('When send a valid packing', () => {
        test('Should return status 201 and call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send(validEntity)

          expect(res.status).toBe(201);
          expect(mockRepository.CreatePacking).toHaveBeenCalledWith(validEntity);
        })
      })

      describe('When send a valid packing with another attributes', () => {
        test('Should return status 201 and call repository\'s create function with just valid attributes', async () => {
          const res = await request(app)
            .post(url)
            .send(validEntityWithInvalidAttributes)

          expect(res.status).toBe(201);
          expect(mockRepository.CreatePacking).toHaveBeenCalledWith(validEntity);
        })
      })

      describe('When send a invalid packing', () => {
        test('Should return status 400 and do not call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send(invalidEntity)

          expect(mockRepository.CreatePacking).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Invalid packing'
          });
        })
      })

      describe('When send without packing', () => {
        test('Should return status 400 and do not call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send()

          expect(mockRepository.CreatePacking).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Packing not provided'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'post', mockRepository.CreatePacking, undefined, validEntity);
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'post', mockRepository.CreatePacking, 'Unexpected error on create packing', validEntity);
        })
      })
    })

    describe(`PUT ${baseUrl}/:packingId (UPDATE)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid packing', () => {
        test('Should return status 201 and call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(validEntity)

          expect(res.status).toBe(201);
          expect(mockRepository.UpdatePacking).toHaveBeenCalledWith(validEntityWithId);
        })
      })

      describe('When send a valid packing with another attributes', () => {
        test('Should return status 201 and call repository\'s update function with just valid attributes', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(validEntityWithInvalidAttributes)

          expect(res.status).toBe(201);
          expect(mockRepository.UpdatePacking).toHaveBeenCalledWith(validEntityWithId);
        })
      })

      describe('When send a invalid packing', () => {
        test('Should return status 400 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(invalidEntity)

          expect(mockRepository.UpdatePacking).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Invalid packing'
          });
        })
      })

      describe('When send without packing', () => {
        test('Should return status 400 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send()

          expect(mockRepository.UpdatePacking).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Packing not provided'
          });
        })
      })

      describe('When send with a invalid packing\'s id', () => {
        test('Should return status 404 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(invalidUrl)
            .send(validEntity)

          expect(mockRepository.UpdatePacking).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid packing\'s id'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.UpdatePacking, undefined, validEntity);
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.UpdatePacking, 'Unexpected error on update packing', validEntity);
        })
      })
    })

    describe(`GET ${baseUrl} (LIST)`, () => {
      const url = baseUrl;

      describe('When everything is OK', () => {
        test('Should return status 200 and the packing\'s list', async () => {
          mockRepository.ListPackings.mockReturnValue(new Promise(resolve => resolve(entitiesList)));

          const res = await request(app)
            .get(url)

          expect(res.status).toBe(200);
          expect(res.body).toMatchObject(entitiesList);
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'get', mockRepository.ListPackings)
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'get', mockRepository.ListPackings, 'Unexpected error on list packings');
        })
      })
    })

    describe(`DELETE ${baseUrl}/:packingId (DELETE)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid packing\'s id', () => {
        test('Should return status 200 and call repository\'s delete function', async () => {
          const res = await request(app)
            .delete(validUrl)

          expect(mockRepository.DeletePacking).toHaveBeenCalledWith(entityId);
          expect(res.status).toBe(201);
        })
      })

      describe('When send with a invalid packing\'s id', () => {
        test('Should return status 404 and do not call repository\'s show function', async () => {
          const res = await request(app)
            .delete(invalidUrl)

          expect(mockRepository.DeletePacking).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid packing\'s id'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.DeletePacking)
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.DeletePacking, 'Unexpected error on delete packing');
        })
      })
    })
  })

  describe('Features', () => {
    //#region Variables
    const baseUrl = '/products/features';

    const entityId: number = 123;
    const validEntity: FeatureEntity = {
      name: 'Name'
    };

    const validEntityWithInvalidAttributes = {
      ...validEntity,
      invalidAttr: 'Invalid'
    };

    const invalidEntity = {
      wrongAttr: 'Invalid'
    };

    const validEntityWithId: FeatureEntity = {
      ...validEntity,
      id: entityId
    }

    const entitiesList: FeatureEntity[] = [
      validEntity, validEntity, validEntity
    ]
    //#endregion

    describe(`POST ${baseUrl} (CREATE)`, () => {
      const url = baseUrl;

      describe('When send a valid feature', () => {
        test('Should return status 201 and call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send(validEntity)

          expect(res.status).toBe(201);
          expect(mockRepository.CreateFeature).toHaveBeenCalledWith(validEntity);
        })
      })

      describe('When send a valid feature with another attributes', () => {
        test('Should return status 201 and call repository\'s create function with just valid attributes', async () => {
          const res = await request(app)
            .post(url)
            .send(validEntityWithInvalidAttributes)

          expect(res.status).toBe(201);
          expect(mockRepository.CreateFeature).toHaveBeenCalledWith(validEntity);
        })
      })

      describe('When send a invalid feature', () => {
        test('Should return status 400 and do not call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send(invalidEntity)

          expect(mockRepository.CreateFeature).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Invalid feature'
          });
        })
      })

      describe('When send without feature', () => {
        test('Should return status 400 and do not call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send()

          expect(mockRepository.CreateFeature).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Feature not provided'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'post', mockRepository.CreateFeature, undefined, validEntity);
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'post', mockRepository.CreateFeature, 'Unexpected error on create feature', validEntity);
        })
      })
    })

    describe(`PUT ${baseUrl}/:featureId (UPDATE)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid feature', () => {
        test('Should return status 201 and call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(validEntity)

          expect(res.status).toBe(201);
          expect(mockRepository.UpdateFeature).toHaveBeenCalledWith(validEntityWithId);
        })
      })

      describe('When send a valid feature with another attributes', () => {
        test('Should return status 201 and call repository\'s update function with just valid attributes', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(validEntityWithInvalidAttributes)

          expect(res.status).toBe(201);
          expect(mockRepository.UpdateFeature).toHaveBeenCalledWith(validEntityWithId);
        })
      })

      describe('When send a invalid feature', () => {
        test('Should return status 400 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(invalidEntity)

          expect(mockRepository.UpdateFeature).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Invalid feature'
          });
        })
      })

      describe('When send without feature', () => {
        test('Should return status 400 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send()

          expect(mockRepository.UpdateFeature).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Feature not provided'
          });
        })
      })

      describe('When send with a invalid feature\'s id', () => {
        test('Should return status 404 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(invalidUrl)
            .send(validEntity)

          expect(mockRepository.UpdateFeature).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid feature\'s id'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.UpdateFeature, undefined, validEntity);
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.UpdateFeature, 'Unexpected error on update feature', validEntity);
        })
      })
    })

    describe(`GET ${baseUrl} (LIST)`, () => {
      const url = baseUrl;

      describe('When everything is OK', () => {
        test('Should return status 200 and the feature\'s list', async () => {
          mockRepository.ListFeatures.mockReturnValue(new Promise(resolve => resolve(entitiesList)));

          const res = await request(app)
            .get(url)

          expect(res.status).toBe(200);
          expect(res.body).toMatchObject(entitiesList);
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'get', mockRepository.ListFeatures)
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'get', mockRepository.ListFeatures, 'Unexpected error on list features');
        })
      })
    })

    describe(`DELETE ${baseUrl}/:featureId (DELETE)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid feature\'s id', () => {
        test('Should return status 200 and call repository\'s delete function', async () => {
          const res = await request(app)
            .delete(validUrl)

          expect(mockRepository.DeleteFeature).toHaveBeenCalledWith(entityId);
          expect(res.status).toBe(201);
        })
      })

      describe('When send with a invalid feature\'s id', () => {
        test('Should return status 404 and do not call repository\'s show function', async () => {
          const res = await request(app)
            .delete(invalidUrl)

          expect(mockRepository.DeleteFeature).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid feature\'s id'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.DeleteFeature)
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.DeleteFeature, 'Unexpected error on delete feature');
        })
      })
    })
  })

  describe('Categories', () => {
    //#region Variables
    const baseUrl = '/products/categories';

    const entityId: number = 123;
    const validEntity: CategoryEntity = {
      name: 'Name',
      image_url: 'Image'
    };

    const validEntityWithInvalidAttributes = {
      ...validEntity,
      invalidAttr: 'Invalid'
    };

    const invalidEntity = {
      wrongAttr: 'Invalid'
    };

    const validEntityWithId: CategoryEntity = {
      ...validEntity,
      id: entityId
    }

    const entitiesList: CategoryEntity[] = [
      validEntity, validEntity, validEntity
    ]
    //#endregion

    describe(`POST ${baseUrl} (CREATE)`, () => {
      const url = baseUrl;

      describe('When send a valid category', () => {
        test('Should return status 201 and call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send(validEntity)

          expect(res.status).toBe(201);
          expect(mockRepository.CreateCategory).toHaveBeenCalledWith(validEntity);
        })
      })

      describe('When send a valid category with another attributes', () => {
        test('Should return status 201 and call repository\'s create function with just valid attributes', async () => {
          const res = await request(app)
            .post(url)
            .send(validEntityWithInvalidAttributes)

          expect(res.status).toBe(201);
          expect(mockRepository.CreateCategory).toHaveBeenCalledWith(validEntity);
        })
      })

      describe('When send a invalid category', () => {
        test('Should return status 400 and do not call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send(invalidEntity)

          expect(mockRepository.CreateCategory).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Invalid category'
          });
        })
      })

      describe('When send without category', () => {
        test('Should return status 400 and do not call repository\'s create function', async () => {
          const res = await request(app)
            .post(url)
            .send()

          expect(mockRepository.CreateCategory).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Category not provided'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'post', mockRepository.CreateCategory, undefined, validEntity);
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'post', mockRepository.CreateCategory, 'Unexpected error on create category', validEntity);
        })
      })
    })

    describe(`PUT ${baseUrl}/:categoryId (UPDATE)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid category', () => {
        test('Should return status 201 and call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(validEntity)

          expect(res.status).toBe(201);
          expect(mockRepository.UpdateCategory).toHaveBeenCalledWith(validEntityWithId);
        })
      })

      describe('When send a valid category with another attributes', () => {
        test('Should return status 201 and call repository\'s update function with just valid attributes', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(validEntityWithInvalidAttributes)

          expect(res.status).toBe(201);
          expect(mockRepository.UpdateCategory).toHaveBeenCalledWith(validEntityWithId);
        })
      })

      describe('When send a invalid category', () => {
        test('Should return status 400 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send(invalidEntity)

          expect(mockRepository.UpdateCategory).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Invalid category'
          });
        })
      })

      describe('When send without category', () => {
        test('Should return status 400 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(validUrl)
            .send()

          expect(mockRepository.UpdateCategory).not.toHaveBeenCalled();
          expect(res.status).toBe(400);
          expect(res.body).toMatchObject({
            message: 'Category not provided'
          });
        })
      })

      describe('When send with a invalid category\'s id', () => {
        test('Should return status 404 and do not call repository\'s update function', async () => {
          const res = await request(app)
            .put(invalidUrl)
            .send(validEntity)

          expect(mockRepository.UpdateCategory).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid category\'s id'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.UpdateCategory, undefined, validEntity);
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'put', mockRepository.UpdateCategory, 'Unexpected error on update category', validEntity);
        })
      })
    })

    describe(`GET ${baseUrl} (LIST)`, () => {
      const url = baseUrl;

      describe('When everything is OK', () => {
        test('Should return status 200 and the category\'s list', async () => {
          mockRepository.ListCategories.mockReturnValue(new Promise(resolve => resolve(entitiesList)));

          const res = await request(app)
            .get(url)

          expect(res.status).toBe(200);
          expect(res.body).toMatchObject(entitiesList);
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'get', mockRepository.ListCategories)
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, url, 'get', mockRepository.ListCategories, 'Unexpected error on list categories');
        })
      })
    })

    describe(`DELETE ${baseUrl}/:categoryId (DELETE)`, () => {
      const validUrl = `${baseUrl}/${entityId}`;
      const invalidUrl = `${baseUrl}/aaa`;

      describe('When send a valid category\'s id', () => {
        test('Should return status 200 and call repository\'s delete function', async () => {
          const res = await request(app)
            .delete(validUrl)

          expect(mockRepository.DeleteCategory).toHaveBeenCalledWith(entityId);
          expect(res.status).toBe(201);
        })
      })

      describe('When send with a invalid category\'s id', () => {
        test('Should return status 404 and do not call repository\'s show function', async () => {
          const res = await request(app)
            .delete(invalidUrl)

          expect(mockRepository.DeleteCategory).not.toHaveBeenCalled();
          expect(res.status).toBe(404);
          expect(res.body).toMatchObject({
            message: 'Invalid category\'s id'
          });
        })
      })

      describe('When repository throws an expected error', () => {
        test('Should return error\'s status and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.DeleteCategory)
        })
      })

      describe('When repository throws an unexpected error', () => {
        test('Should return status 500 and error\'s message', async () => {
          await testWhenRepoThrowsError(app, validUrl, 'delete', mockRepository.DeleteCategory, 'Unexpected error on delete category');
        })
      })
    })
  })
})