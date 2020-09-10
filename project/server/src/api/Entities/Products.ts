//#region Table Entities
// Category
export interface CategoryEntity {
  id?: number;
  name: string;
  image_url: string;
  category_id?: number | null;
}

// Feature
export interface FeatureEntity {
  id?: number;
  name: string;
}

export interface ProductFeaturesEntity {
  id?: number;
  product_id: number;
  feature_id: number;
}

// Packing
export interface PackingEntity {
  id?: number;
  size: number;
  unit_abbreviation: string;
  unit: string;
  name: string;
  cost: number;
}

export interface ProductPackingsEntity {
  id?: number;
  product_id: number;
  packing_id: number;
  price: number;
  quantity: number;
}

// Product
export interface ProductEntity {
  id?: number;
  name: string;
  description: string;
  is_packed: boolean;
  unit_cost: number;
  unit_price?: number | null;
  category_id: number;
  is_activated: boolean;
}
//#endregion

//#region Auxiliares Entities
interface FullPackingEntity extends PackingEntity {
  productPacking: ProductPackingsEntity;
}

export interface FullProductEntity extends ProductEntity {
  features: FeatureEntity[];
  packings: FullPackingEntity[];
  category: CategoryEntity;
}
//#endregion