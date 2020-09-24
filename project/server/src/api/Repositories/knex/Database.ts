import Knex from 'knex';
import knexConfig from './database/knexConfig';

import IDatabase from "../IDatabase";

export default class Database implements IDatabase {
  public knex: Knex;

  constructor() {
    const env = process.env.NODE_ENV || 'development';
    const config = knexConfig[env];
    
    this.knex = Knex(config);
  }

  private async unlock(): Promise<void> {
    const exists = await this.knex.schema.hasTable("knex_migrations_lock");
    if (exists) {
      await this.knex("knex_migrations_lock")
        .update("is_locked", '0');
    }
  }

  // async prepareDB(): Promise<void> {
  //   const tables = _.difference(Object.values(Table), []).join(",");
  //   await this.knex.raw(`TRUNCATE TABLE ${tables} CASCADE`);
  // }

  async Setup(): Promise<void> {
    await this.unlock();
    await this.knex.migrate.latest();
  }
  async Teardown(): Promise<void> {
    await this.unlock();
    await this.knex.migrate.rollback({}, true);
  }
}