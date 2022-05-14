import { InjectorToken } from '@fm/di';

export const ENVIRONMENT = InjectorToken.get('ENVIRONMENT');

export const HISTORY = InjectorToken.get('HISTORY');
export const MICRO_OPTIONS = InjectorToken.get('MICRO_MANAGER');
export const LAZY_MICRO = InjectorToken.get('LAZY_MICRO');

export const APP_INITIALIZER = InjectorToken.get('APP_INITIALIZER');

export const ROUTER_CONFIG = InjectorToken.get('ROUTER_CONFIG');
export const ROUTER_INTERCEPT = InjectorToken.get('ROUTER_INTERCEPT');
