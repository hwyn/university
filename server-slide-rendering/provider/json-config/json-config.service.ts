import { READ_FILE_STATIC } from '../../token/token';
import { Inject, Injectable, JsonConfigImplements } from '@di';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

type readFileType = (url: string) => Observable<object>;

@Injectable()
export class JsonConfigService implements JsonConfigImplements {
  private cacheConfig: Map<string, Observable<object>> = new Map();
  constructor(
    @Inject(READ_FILE_STATIC) private readFieldStatic: readFileType
  ) { }

  getJsonConfig(url: string): Observable<object> {
    let subject = this.cacheConfig.get(url);
    if (!subject) {
      subject = this.readFieldStatic(url).pipe(
        shareReplay(1),
        map((json) => cloneDeep(json))
      );
      this.cacheConfig.set(url, subject);
    }
    return subject;
  }
}
