import { Provider } from '@di';
import { Platform } from './platform';

export const dynamicPlatform = (providers: Provider[] = []) => {
  return new Platform(providers);
};
