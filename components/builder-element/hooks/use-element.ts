import { useEffect, useState } from 'react';
import { ElementProps } from '../builder';
import { RenderElementProps } from '../grid';

export const useElement = <T = ElementProps>(props: RenderElementProps): T => {
  const { builder, builder: { ls }, field: builderField } = props;
  const { id, source, control, instance, field = {}, events = {} } = builderField;

  const [, markForCheck] = useState(0);

  useEffect(() => {
    instance.detectChanges = () => markForCheck(Math.random());
    return () => instance.destory.next(id);
  }, []);

  return { id, ls, builder, events, source, control, instance, ...field } as unknown as T;
};
