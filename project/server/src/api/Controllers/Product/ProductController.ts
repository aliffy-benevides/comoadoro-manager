import { Router, Request, Response, NextFunction } from "express";

import IController from "../IController";
import IProductRepository from "../../Repositories/IProductRepository";
import { FullProductEntity, FeatureEntity, PackingEntity, CategoryEntity } from "../../Entities/Products";

import ControllerException from "../ControllerException";
import ApiException from "../../ApiException";

interface ProductParams {
  productId: string;
}
type CreateProductRequest = Request<null, null, FullProductEntity>;
type UpdateProductRequest = Request<ProductParams, null, FullProductEntity>;

interface PackingParams {
  packingId: string;
}
type CreatePackingRequest = Request<null, null, PackingEntity>;
type UpdatePackingRequest = Request<PackingParams, null, PackingEntity>;

interface FeatureParams {
  featureId: string;
}
type CreateFeatureRequest = Request<null, null, FeatureEntity>;
type UpdateFeatureRequest = Request<FeatureParams, null, FeatureEntity>;

interface CategoryParams {
  categoryId: string;
}
type CreateCategoryRequest = Request<null, null, CategoryEntity>;
type UpdateCategoryRequest = Request<CategoryParams, null, CategoryEntity>;

export default class ProductController implements IController {
  readonly Path = '/products';
  readonly Router = Router();

  constructor(private repo: IProductRepository) {
    // More specific Routes go first
    // Packings
    this.Router.post('/packings', this.CreatePacking);
    this.Router.put('/packings/:packingId', this.UpdatePacking);
    this.Router.get('/packings', this.ListPackings);
    this.Router.delete('/packings/:packingId', this.DeletePacking);
    
    // Features
    this.Router.post('/features', this.CreateFeature);
    this.Router.put('/features/:featureId', this.UpdateFeature);
    this.Router.get('/features', this.ListFeatures);
    this.Router.delete('/features/:featureId', this.DeleteFeature);
    
    // Features
    this.Router.post('/categories', this.CreateCategory);
    this.Router.put('/categories/:categoryId', this.UpdateCategory);
    this.Router.get('/categories', this.ListCategories);
    this.Router.delete('/categories/:categoryId', this.DeleteCategory);

    // Products
    this.Router.post('/', this.Create);
    this.Router.put('/:productId', this.Update);
    this.Router.get('/:productId', this.Show);
    this.Router.get('/', this.List);
    this.Router.delete('/:productId', this.Delete);

    this.Router.use('/', this.ErrorHandler);
  }

  private ParseProduct = (sendedProduct: FullProductEntity): FullProductEntity => {
    if (!sendedProduct || Object.keys(sendedProduct).length === 0)
      throw new ControllerException(400, 'Product not provided');

    // Ensure that cannot pass invalid attributes
    let {
      name, description, is_packed,
      unit_cost, unit_price,
      category_id, is_activated,

      features, packings, category
    } = sendedProduct;


    try {
      if (!name)
        throw 'Name is required';
      if (!description)
        throw 'Description is required';
      if (!is_packed)
        throw 'Is packed attribute is required';
      if (!is_activated)
        throw 'Is activated attribute is required';
      if (!category_id)
        throw 'Category id is required';
      if (!unit_cost)
        unit_cost = 0;

      if (!features)
        features = [];
      if (!packings)
        packings = [];

      for (const feature of features) {
        if (!feature.id && feature.id !== 0)
          throw 'Some features\' id was not provided';
      }

      packings = packings.map(packing => {
        if (!packing.id && packing.id !== 0)
          throw 'Some packings\' id was not provided';
  
        let { price, quantity, product_id, packing_id, id } = packing.productPacking;
        price = (isNaN(price) || price < 0) ? 0 : price;
        quantity = (isNaN(quantity) || quantity < 0) ? 0 : quantity;

        return {
          ...packing,
          productPacking: { price, quantity, product_id, packing_id, id }
        };
      })

      const product = {
        name, description, is_packed,
        unit_cost, unit_price,
        category_id, is_activated,

        features, packings, category
      };

      return product;
    } catch (error) {
      throw new ControllerException(400, 'Invalid product', error);
    }
  }

  private ParsePacking = (sendedPacking: PackingEntity): PackingEntity => {
    if (!sendedPacking || Object.keys(sendedPacking).length === 0)
      throw new ControllerException(400, 'Packing not provided');

    // Ensure that cannot pass invalid attributes
    let {
      name, cost, size,
      unit, unit_abbreviation
    } = sendedPacking;

    try {
      if (!name)
        throw 'Name is required';
      if (!size)
        throw 'Size is required';
      cost = cost || 0;
      unit = unit || null;
      unit_abbreviation = unit_abbreviation || null;

      const packing = {
        name, cost, size,
        unit, unit_abbreviation
      };
      return packing;
    } catch (error) {
      throw new ControllerException(400, 'Invalid packing', error);
    }
  }

  private ParseFeature = (sendedFeature: FeatureEntity): FeatureEntity => {
    if (!sendedFeature || Object.keys(sendedFeature).length === 0)
      throw new ControllerException(400, 'Feature not provided');

    // Ensure that cannot pass invalid attributes
    const { name } = sendedFeature;

    try {
      if (!name)
        throw 'Name is required';

      const feature = { name };
      return feature;
    } catch (error) {
      throw new ControllerException(400, 'Invalid feature', error);
    }
  }

  private ParseCategory = (sendedCategory: CategoryEntity): CategoryEntity => {
    if (!sendedCategory || Object.keys(sendedCategory).length === 0)
      throw new ControllerException(400, 'Category not provided');

    // Ensure that cannot pass invalid attributes
    let { name, image_url, category_id } = sendedCategory;

    try {
      if (!name)
        throw 'Name is required';
      image_url = image_url || null;
      category_id = category_id || null;

      const category = { name, image_url, category_id };
      return category;
    } catch (error) {
      throw new ControllerException(400, 'Invalid category', error);
    }
  }

  private ParseId = (paramId: string, errorMessage: string): number => {
    const id = parseInt(paramId);
    if (isNaN(id))
      throw new ControllerException(404, errorMessage);

    return id;
  }

  private ParseError = (error: any, defaultMessage: string): ApiException => {
    if (error instanceof ApiException)
      return error;

    return new ApiException(500, defaultMessage, error);
  }

  private ErrorHandler = (error: ApiException, req: Request, res: Response, next: NextFunction) => {
    return res.status(error.status).json(error);
  }

  //#region Products CRUD
  private Create = async (req: CreateProductRequest, res: Response, next: NextFunction) => {
    try {
      const product = this.ParseProduct(req.body);

      await this.repo.Create(product);
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on create product'));
    }
  }

  private Update = async (req: UpdateProductRequest, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.productId, 'Invalid product\'s id');
      const product = this.ParseProduct(req.body);

      await this.repo.Update({ ...product, id });
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on update product'));
    }
  }

  private Show = async (req: Request<ProductParams>, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.productId, 'Invalid product\'s id');

      const product = await this.repo.Show(id);
      return res.json(product);
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on show product'));
    }
  }

  private List = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.repo.List();
      return res.json(products);
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on list products'));
    }
  }

  private Delete = async (req: Request<ProductParams>, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.productId, 'Invalid product\'s id');

      await this.repo.Delete(id);
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on delete product'));
    }
  }
  //#endregion

  //#region Packings CRUD
  private CreatePacking = async (req: CreatePackingRequest, res: Response, next: NextFunction) => {
    try {
      const packing = this.ParsePacking(req.body);

      await this.repo.CreatePacking(packing);
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on create packing'));
    }
  }

  private UpdatePacking = async (req: UpdatePackingRequest, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.packingId, 'Invalid packing\'s id');
      const packing = this.ParsePacking(req.body);

      await this.repo.UpdatePacking({ ...packing, id });
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on update packing'));
    }
  }

  private ListPackings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const packings = await this.repo.ListPackings();
      return res.json(packings);
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on list packings'));
    }
  }

  private DeletePacking = async (req: Request<PackingParams>, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.packingId, 'Invalid packing\'s id');

      await this.repo.DeletePacking(id);
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on delete packing'));
    }
  }
  //#endregion

  //#region Features CRUD
  private CreateFeature = async (req: CreateFeatureRequest, res: Response, next: NextFunction) => {
    try {
      const feature = this.ParseFeature(req.body);

      await this.repo.CreateFeature(feature);
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on create feature'));
    }
  }

  private UpdateFeature = async (req: UpdateFeatureRequest, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.featureId, 'Invalid feature\'s id');
      const feature = this.ParseFeature(req.body);

      await this.repo.UpdateFeature({ ...feature, id });
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on update feature'));
    }
  }

  private ListFeatures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const features = await this.repo.ListFeatures();
      return res.json(features);
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on list features'));
    }
  }

  private DeleteFeature = async (req: Request<FeatureParams>, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.featureId, 'Invalid feature\'s id');

      await this.repo.DeleteFeature(id);
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on delete feature'));
    }
  }
  //#endregion

  //#region Categories CRUD
  private CreateCategory = async (req: CreateCategoryRequest, res: Response, next: NextFunction) => {
    try {
      const category = this.ParseCategory(req.body);

      await this.repo.CreateCategory(category);
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on create category'));
    }
  }

  private UpdateCategory = async (req: UpdateCategoryRequest, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.categoryId, 'Invalid category\'s id');
      const category = this.ParseCategory(req.body);

      await this.repo.UpdateCategory({ ...category, id });
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on update category'));
    }
  }

  private ListCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.repo.ListCategories();
      return res.json(categories);
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on list categories'));
    }
  }

  private DeleteCategory = async (req: Request<CategoryParams>, res: Response, next: NextFunction) => {
    try {
      const id = this.ParseId(req.params.categoryId, 'Invalid category\'s id');

      await this.repo.DeleteCategory(id);
      return res.status(201).send();
    } catch (error) {
      return next(this.ParseError(error, 'Unexpected error on delete category'));
    }
  }
  //#endregion
}