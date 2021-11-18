import { Observable } from 'rxjs';

export interface MicroStoreInterface {
  isFirstMounted?: boolean;
  onMounted(container: HTMLElement, options?: any): Promise<any>;
  unMounted(container: HTMLElement): Promise<any>;
}

export interface MicroManageInterface {
  bootstrapMicro(microName: string): Observable<MicroStoreInterface>;
}
