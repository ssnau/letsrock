import { Context as KoaContext } from "koa";
// Node.js Global
interface RockGlobal {
  ROCK_CONFIG: RockConfig;
  APP_BASE: string;
  MYSQL_CONNECTION: any;
  HASH: string;
  __IS_DEV__: boolean;
  ROCKUTIL: {
    minifyJS(code: string): string;
  };
  getCWD(): string;
}

interface RockConfig {
  autoMount: boolean;
  serverRender: boolean;
  port: number;
  skipBuildOnProduction: boolean;
  metas: string;
  redisPort: number;
  mysqlPort: number;
  disableDemoRedis: boolean;
  uploadedFolder: string;
  cdnPrefix: string;
  serveFilePath: string;
  static: S2S;
  from: string;
  mysql: {
    host: string;
    user: string;
    password: string;
    port: number;
  };
  debug_flag: string;
  chnrouteDir: string;
}

interface Injector {
  get(name: string): Promise<any>;
  invoke(fn: Function): any;
}
// utils
interface S2S {
  [name: string]: string;
}

// for rendering
interface Meta {
  ssr?: boolean;
  skipHydrate?: boolean;
  merge_global_metas?: boolean;
  metas?: string;
  appId?: string;
  title: string;
}

interface InjectionConditions {
  [key: string]: new (...args: any) => any;
}

// Koa Context
type cc = new (...args: any) => any;

export interface Context extends KoaContext {
  requestId: string;
  serverTimings: Array<Timing>;
  startTime: (name: string) => () => void;
  $injector: Injector;

  // ************************************** //
  // *********** getInjections ************ //
  // ************************************** //
  // getInjection('request')
  getInjection(name: string): Promise<any>;
  // const getInjection('response')
  getInjection<S extends new (...args: any) => any>(
    name: S
  ): Promise<InstanceType<S>>;
  /*
  getInjection<K extends string, T extends new (...args: any) => any>(
    obj: Record<K, T>,
  ): Promise<Record<K, InstanceType<T>>>;
  */

  getInjection<
    T extends InjectionConditions,
    U extends { [key in keyof T]: InstanceType<T[key]> }
  >(
    conditions: T
  ): Promise<U>;

  // overloads on array types
  getInjections<S1 extends cc>(clazzes: [S1]): Promise<[InstanceType<S1>]>;

  getInjections<S1 extends cc, S2 extends cc>(
    clazzes: [S1, S2]
  ): Promise<[InstanceType<S1>, InstanceType<S2>]>;

  getInjections<S1 extends cc, S2 extends cc, S3 extends cc>(
    clazzes: [S1, S2, S3]
  ): Promise<[InstanceType<S1>, InstanceType<S2>, InstanceType<S3>]>;

  getInjections<S1 extends cc, S2 extends cc, S3 extends cc, S4 extends cc>(
    clazzes: [S1, S2, S3, S4]
  ): Promise<
    [InstanceType<S1>, InstanceType<S2>, InstanceType<S3>, InstanceType<S4>]
  >;

  getInjections<
    S1 extends cc,
    S2 extends cc,
    S3 extends cc,
    S4 extends cc,
    S5 extends cc
  >(
    clazzes: [S1, S2, S3, S4, S5]
  ): Promise<
    [
      InstanceType<S1>,
      InstanceType<S2>,
      InstanceType<S3>,
      InstanceType<S4>,
      InstanceType<S5>
    ]
  >;

  getInjections<
    S1 extends cc,
    S2 extends cc,
    S3 extends cc,
    S4 extends cc,
    S5 extends cc,
    S6 extends cc
  >(
    clazzes: [S1, S2, S3, S4, S5, S6]
  ): Promise<
    [
      InstanceType<S1>,
      InstanceType<S2>,
      InstanceType<S3>,
      InstanceType<S4>,
      InstanceType<S5>,
      InstanceType<S6>
    ]
  >;

  getInjections<
    S1 extends cc,
    S2 extends cc,
    S3 extends cc,
    S4 extends cc,
    S5 extends cc,
    S6 extends cc,
    S7 extends cc
  >(
    clazzes: [S1, S2, S3, S4, S5, S6, S7]
  ): Promise<
    [
      InstanceType<S1>,
      InstanceType<S2>,
      InstanceType<S3>,
      InstanceType<S4>,
      InstanceType<S5>,
      InstanceType<S6>,
      InstanceType<S7>
    ]
  >;

  getInjections<
    S1 extends cc,
    S2 extends cc,
    S3 extends cc,
    S4 extends cc,
    S5 extends cc,
    S6 extends cc,
    S7 extends cc,
    S8 extends cc
  >(
    clazzes: [S1, S2, S3, S4, S5, S6, S7, S8]
  ): Promise<
    [
      InstanceType<S1>,
      InstanceType<S2>,
      InstanceType<S3>,
      InstanceType<S4>,
      InstanceType<S5>,
      InstanceType<S6>,
      InstanceType<S7>,
      InstanceType<S8>
    ]
  >;

  getInjections<
    S1 extends cc,
    S2 extends cc,
    S3 extends cc,
    S4 extends cc,
    S5 extends cc,
    S6 extends cc,
    S7 extends cc,
    S8 extends cc,
    S9 extends cc
  >(
    clazzes: [S1, S2, S3, S4, S5, S6, S7, S8, S9]
  ): Promise<
    [
      InstanceType<S1>,
      InstanceType<S2>,
      InstanceType<S3>,
      InstanceType<S4>,
      InstanceType<S5>,
      InstanceType<S6>,
      InstanceType<S7>,
      InstanceType<S8>,
      InstanceType<S9>
    ]
  >;

  getInjections<
    S1 extends cc,
    S2 extends cc,
    S3 extends cc,
    S4 extends cc,
    S5 extends cc,
    S6 extends cc,
    S7 extends cc,
    S8 extends cc,
    S9 extends cc,
    S10 extends cc
  >(
    clazzes: [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10]
  ): Promise<
    [
      InstanceType<S1>,
      InstanceType<S2>,
      InstanceType<S3>,
      InstanceType<S4>,
      InstanceType<S5>,
      InstanceType<S6>,
      InstanceType<S7>,
      InstanceType<S8>,
      InstanceType<S9>,
      InstanceType<S10>
    ]
  >;
  // ************************************** //
  // ***************** [end] ************** //
  // ************************************** //
}

// For Timing Middleware
export interface Timing {
  name: string;
  desc: string;
  ms: number;
}

// Controller
export interface Controller {
  url: string;
  method?:
    | "get"
    | "GET"
    | "post"
    | "POST"
    | "delete"
    | "DELETE"
    | "put"
    | "PUT";
  controller(context: Context): Promise<string | void>;
}
