import IDatabase from "../IDatabase";

export default class Database implements IDatabase {
  Setup(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  Teardown(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}