import { Observable } from 'rxjs';

export abstract class AbstractJsonConfig {
  abstract getJsonConfig(jsonName: string): Observable<any>;
}
