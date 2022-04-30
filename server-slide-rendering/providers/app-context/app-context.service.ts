import { AppContextService as SharedAppContextService, Fetch } from '@shared/providers/app-context';

export class AppContextService extends SharedAppContextService {
  get fetch(): Fetch {
    return this.getContext().fetch;
  }
}
