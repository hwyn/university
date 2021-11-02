import { BuilderFieldExtensions, BuilderModelExtensions, Grid } from 'dynamic-builder';
import { Observable } from 'rxjs';

export interface RenderPropsModel {
  fields?: BuilderFieldExtensions[];
  builder: BuilderModelExtensions;
  className?: string;
  additional?: any;
  grid?: Grid;
  events?: { [key: string]: (params?: any) => Observable<any> };
}

export interface RenderElementProps {
  builder: BuilderModelExtensions;
  field: BuilderFieldExtensions;
}
