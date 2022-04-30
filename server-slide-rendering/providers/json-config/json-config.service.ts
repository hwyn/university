import { Injectable, LocatorStorage } from '@di';
import { JsonConfigService as ShareJsonConfigService } from '@shared/providers/json-config';

import { AppContextService } from '../app-context';

@Injectable()
export class JsonConfigService extends ShareJsonConfigService {
  declare protected appContext: AppContextService;
  constructor(protected ls: LocatorStorage) {
    super(ls);
  }

  protected getServerFetchData(url: string) {
    return this.appContext.readStaticFile(url);
  }
}
