import { AppContextService as SharedAppContextService } from '@shared/providers/app-context';
import { Observable, of } from 'rxjs';

type MicroMiddleware = () => Observable<any>;
export class AppContextService extends SharedAppContextService {
  private pageFileSource: { [key: string]: any } = {};
  private microMiddlewareList: MicroMiddleware[] = [];

  public readStaticFile(url: string) {
    const { resource, readStaticFile } = this.getContext();
    const source = JSON.parse(readStaticFile(url) || '{}');
    const fileCache = { type: 'file-static', source };
    this.pageFileSource[url] = fileCache;
    resource[url] = fileCache;
    return of(source);
  }

  public registryMicroMidder(middleware: MicroMiddleware) {
    this.microMiddlewareList.push(middleware);
  }

  public getPageFileSource() {
    return JSON.stringify(this.pageFileSource);
  }

  public getAllFileSource() {
    return JSON.stringify(this.getContext().resource);
  }

  public getpageMicroMiddleware() {
    return this.microMiddlewareList;
  }
}
