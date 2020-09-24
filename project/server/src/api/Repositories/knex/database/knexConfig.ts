import path from 'path';

interface KnexConfig {
  [key: string]: object
}

const defaultConfigs = {
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    extension: 'ts'
  }
}

const knexConfig: KnexConfig = {
  test: {
    ...defaultConfigs,
    client: "sqlite3",
    connection: {
      filename: path.resolve(__dirname, 'test.sqlite')
    }
  },
  development: {
    ...defaultConfigs,
    client: "sqlite3",
    connection: {
      filename: path.resolve(__dirname, 'dev.sqlite')
    }
  }
};

export default knexConfig;
