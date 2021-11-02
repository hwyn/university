import { FormControl } from '../../../common/form';
import { BuilderModelExtensions, InstanceExtensions, LocatorStorageImplements } from 'dynamic-builder';
import { Observable } from 'rxjs';

export interface ElementProps {
  id: string;
  source?: any;
  control?: FormControl;
  instance: InstanceExtensions;
  builder: BuilderModelExtensions;
  ls: LocatorStorageImplements;
  events?: { [key: string]: (params?: any) => Observable<any> };
}
