import { Observable } from 'rxjs';

export interface MicroStoreInterface {
  isFirstMounted?: boolean;
  onMounted(continer: HTMLElement, options?: any): Promise<any>;
  unMounted(continer: HTMLElement): Promise<any>;
}

export interface MicroManageInterface {
  bootstrapMicro(microName: string): Observable<MicroStoreInterface>;
}
