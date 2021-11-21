import { Observable } from 'rxjs';

export interface MicroStoreInterface {
  isFirstMounted?: boolean;
  onMounted(container: HTMLElement, options?: any): void;
  unMounted(container: HTMLElement): void;
}

export interface MicroManageInterface {
  bootstrapMicro(microName: string): Observable<MicroStoreInterface>;
}
