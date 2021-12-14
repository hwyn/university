import { InjectorToken } from '@di';

export const ENVIRONMENT = InjectorToken.get('ENVIRONMENT');
export const FETCH = InjectorToken.get('FETCH');

export const HISTORY = InjectorToken.get('HISTORY');
export const IS_MICRO = InjectorToken.get('IS_MICRO');
export const MICRO_MANAGER = InjectorToken.get('MICRO_MANAGER');
export const MICRO_OPTIONS = InjectorToken.get('MICRO_MANAGER');

export const APP_INITIALIZER = InjectorToken.get('APP_INITIALIZER');

export const ROUTER_CONFIG = InjectorToken.get('ROUTER_CONFIG');
export const ROUTER_INTERCEPT = InjectorToken.get('ROUTER_INTERCEPT');

export { JSON_CONFIG } from '@di';
