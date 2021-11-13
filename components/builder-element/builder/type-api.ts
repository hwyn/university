import { LocatorStorageImplements } from '@di';
import { BuilderModelExtensions, InstanceExtensions } from 'dynamic-builder';
import { Observable } from 'rxjs';
import { FormControl } from '../../../common/form';

export interface ElementProps {
  id: string;
  source?: any;
  control?: FormControl;
  instance: InstanceExtensions;
  builder: BuilderModelExtensions;
  ls: LocatorStorageImplements;
  events?: { [key: string]: (params?: any) => Observable<any> };
}
