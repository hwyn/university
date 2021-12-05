import { Type } from "./type-api";

export abstract class LocatorStorageImplements {
  abstract getProvider<T = any>(target: any, ...params: any[]): T;
  abstract getService<T>(target: Type<T>): T;
}