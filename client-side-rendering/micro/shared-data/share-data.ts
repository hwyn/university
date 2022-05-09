import { Injectable } from '@di';
import { SharedDataInterface } from '@shared/micro/types';

@Injectable()
export class SharedData implements SharedDataInterface {
  private data: Map<string, any> = new Map();

  set(key: string, value: any) {
    this.data.set(key, value);
  }

  get<T>(key: string): T {
    return this.data.get(key);
  }
}