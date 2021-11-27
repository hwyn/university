import { Provider } from '@di';
import { Platform } from './platform';

export const dynamicPlatform = (providers: Provider[] = []): Platform => new Platform(providers);
