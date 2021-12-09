import { Injectable, LocatorStorage } from '@di';
import { AbstractJsonConfigService } from '@shared/providers/json-config';
import { Observable } from 'rxjs';

import { READ_FILE_STATIC } from '../../token';

type readFileType = (url: string) => Observable<object>;

@Injectable()
export class JsonConfigService extends AbstractJsonConfigService {
  protected getServerFetchData: readFileType = this.ls.getProvider(READ_FILE_STATIC);

  constructor(protected ls: LocatorStorage) {
    super(ls);
  }
}
