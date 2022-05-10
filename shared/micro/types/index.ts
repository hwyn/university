import { Observable, Subject } from '@fm/import-rxjs';

export interface MicroStoreInterface {
  onMounted(container: HTMLElement, options?: any): void;
  unMounted(container: HTMLElement): void;
}

export interface SharedDataInterface {
  set(key: string, value: any): void;
  get<T>(key: string): T;
}

export interface MicroManageInterface {
  readonly loaderStyleSubject?: Subject<HTMLStyleElement>;
  readonly sharedData: SharedDataInterface;
  bootstrapMicro(microName: string): Observable<MicroStoreInterface>;
}
