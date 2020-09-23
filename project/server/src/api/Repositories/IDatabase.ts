export default interface IDatabase {
  Setup(): Promise<void>;
  Teardown(): Promise<void>;
}