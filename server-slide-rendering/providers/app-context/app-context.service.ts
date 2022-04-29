import { InjectorToken } from '@di';
import { AppContextService as SharedAppContextService, Fetch } from '@shared/providers/app-context';

export const FETCH = InjectorToken.get('FETCH');

export class AppContextService extends SharedAppContextService {
  get fetch(): Fetch {
    return this.getContext().fetch;
  }
}
