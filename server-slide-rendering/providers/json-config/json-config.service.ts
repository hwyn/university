import { Injectable, LocatorStorage } from '@di';
import { AbstractJsonConfigService } from '@shared/providers/json-config';
import { Observable } from 'rxjs';
import { READ_FILE_STATIC } from '../../token';

type readFileType = (url: string) => Observable<object>;

@Injectable()
export class JsonConfigService extends AbstractJsonConfigService {
  private readFieldStatic: readFileType = this.ls.getProvider(READ_FILE_STATIC);

  constructor(protected ls: LocatorStorage) {
    super(ls);
  }

  protected getServerFetchData(url: string): Observable<object> {
    return this.readFieldStatic(url);
  }
}
