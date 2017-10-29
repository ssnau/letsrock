export type Context = {
  throw: function,
  params: any,
  body: any,
}

export type Injector = {
  get: function,
}

export type BaseModel = {
  tableName: string,
  findAll: function,
  findOne: function,
  findById: function,
  create: function,
}

export type GetService = (string) => any;

declare var __IS_DEV__: bool;
declare var getCWD: () => string;
declare var APP_BASE: string;
