import * as Knex from "knex";

const TABLE_NAME: string = 'customers';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable(TABLE_NAME, table => {
    table.increments('id').primary();

    table.string('name').notNullable();
    table.string('email').notNullable();
    table.string('phone').notNullable();
    table.string('address').notNullable();
    table.string('observation');
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable(TABLE_NAME);
}
