import IRepository from "./IRepository";
import { FullProductEntity, PackingEntity, FeatureEntity, CategoryEntity, ProductPackingsEntity } from "../Entities/Products";

export default interface IProductRepository extends IRepository<FullProductEntity> {
  /**
   * Create the packing on Repository
   * @param packing packing to be created
   */
  CreatePacking(packing: PackingEntity): Promise<void>;
  /**
   * Update the packing on Repository
   * @param packing packing to be updated
   */
  UpdatePacking(packing: PackingEntity): Promise<void>;
  /**
   * List the packings from Repository
   */
  ListPackings(): Promise<PackingEntity[]>;
  /**
   * Delete the packing from Repository
   * @param packingId Id of the packing
   */
  DeletePacking(packingId: number): Promise<void>;

  CreateFeature(feature: FeatureEntity): Promise<void>;
  UpdateFeature(feature: FeatureEntity): Promise<void>;
  ListFeatures(): Promise<FeatureEntity[]>;
  DeleteFeature(featureId: number): Promise<void>;

  CreateCategory(category: CategoryEntity): Promise<void>;
  UpdateCategory(category: CategoryEntity): Promise<void>;
  ListCategories(): Promise<CategoryEntity[]>;
  DeleteCategory(categoryId: number): Promise<void>;
  
  ShowProductPacking(productPackingId: number): Promise<ProductPackingsEntity>;
  UpdateProductPacking(p: ProductPackingsEntity): Promise<void>;
}
