import { registryProvider } from '@di';

import { builderExtensions } from './builder-extension';

registryProvider(builderExtensions);

export * from './builder';
export * from './builder-extension';
export * from './token';
