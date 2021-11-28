import { builderExtensions } from './builder-extension';
import { registryProvider } from '@di';

registryProvider(builderExtensions);

export * from './builder';
export * from './builder-extension';
export * from './token';
