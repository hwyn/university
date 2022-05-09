import { Provider } from '@fm/di';

import { ExpressServerPlatform } from './platform';

export const dyanmicServer = (providers: Provider[] = []) => new ExpressServerPlatform(providers);
