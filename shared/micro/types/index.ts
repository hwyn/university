import { Observable, Subject } from 'rxjs';

export interface MicroStoreInterface {
  onMounted(container: HTMLElement, options?: any): void;
  unMounted(container: HTMLElement): void;
}

export interface MicroManageInterface {
  readonly loaderStyleSubject?: Subject<HTMLStyleElement>;
  bootstrapMicro(microName: string): Observable<MicroStoreInterface>;
}
