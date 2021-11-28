import { InjectorToken } from './injector-token';

export * from './injector-token';
export * from './injectable';
export * from './abstract-injector';
export * from './type-api';

export const LOCAL_STORAGE = InjectorToken.get('LOCAL_STORAGE');
export const JSON_CONFIG = InjectorToken.get('GET_CONFIG_METHOD');
