export default interface IRepository<Entity> {
  Create(entity: Entity): Promise<void>;
  Update(entity: Entity): Promise<void>;
  Show(entityId: number): Promise<Entity>;
  List(filters: object, sort: object[]): Promise<Entity[]>;
  Delete(entityId: number): Promise<void>;
}
