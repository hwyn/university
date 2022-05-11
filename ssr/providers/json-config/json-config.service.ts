import { Injectable } from '@fm/di';
import { JsonConfigService as ShareJsonConfigService } from '@fm/shared/providers/json-config';

import { AppContextService } from '../app-context';

@Injectable()
export class JsonConfigService extends ShareJsonConfigService {
  declare protected appContext: AppContextService;
  protected getServerFetchData(url: string) {
    return this.appContext.readStaticFile(url);
  }
}
