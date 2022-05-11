import { Provider } from '@fm/di';

import { Platform } from './platform';

export const dynamicPlatform = (providers: Provider[] = []) => new Platform(providers);
