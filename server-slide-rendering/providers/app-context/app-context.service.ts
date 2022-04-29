import { InjectorToken } from '@di';
import { AppContextService as SharedAppContextService, Fetch } from '@shared/providers/app-context';
import { Observable } from 'rxjs';

export const FETCH = InjectorToken.get('FETCH');
export type readFileType = (url: string) => Observable<object>;

export class AppContextService extends SharedAppContextService {
  get fetch(): Fetch {
    return this.getContext().fetch;
  }
}
