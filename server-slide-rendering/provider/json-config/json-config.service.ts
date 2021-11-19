import { Inject, Injectable, LOCAL_STORAGE, LocatorStorageImplements } from '@di';
import { AbstractJsonConfigService } from '@university/provider/services';
import { Observable } from 'rxjs';
import { READ_FILE_STATIC } from '../../token';

type readFileType = (url: string) => Observable<object>;

@Injectable()
export class JsonConfigService extends AbstractJsonConfigService {
  private readFieldStatic: readFileType = this.ls.getProvider(READ_FILE_STATIC);

  constructor(@Inject(LOCAL_STORAGE) protected ls: LocatorStorageImplements) {
    super(ls);
  }

  protected getServerFetchData(url: string): Observable<object> {
    return this.readFieldStatic(url);
  }
}
