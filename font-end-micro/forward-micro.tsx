import { getProvider } from '@di';
import { ElementProps } from '@university/components/builder-element/builder/type-api';
import { isEmpty } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { filter } from 'rxjs/operators';
import { MICRO_MANAGER } from './token';
import { MicroManageInterface, MicroStoreInterface } from './types';

interface MicroProps extends ElementProps {
  [key: string]: any;
}

export const forwardMicro = (microName: string) => ({ instance, ...props }: MicroProps) => {
  const ref = useRef<any>();
  const manageMicro = getProvider<MicroManageInterface>(MICRO_MANAGER);
  const ele = typeof document !== 'undefined' && document.querySelector(`[data-micro="${microName}"]`);
  let applicationMicro: MicroStoreInterface = void (0) as any;
  let setApplication: any = void (0);
  manageMicro.bootstrapMicro(microName).pipe(filter((result => !isEmpty(result)))).subscribe((result) => {
    setApplication ? setApplication(result) : applicationMicro = result;
  });
  const [application, _setApplication] = useState(applicationMicro);
  setApplication = _setApplication;

  useEffect(() => {
    if (application && ref.current) {
      const continer = ref.current;
      if (instance) {
        instance.current = application;
      }
      application.onMounted(ref.current, props);
      return () => { application.unMounted(continer); };
    }
  }, [ref.current, application]);
  return (
    <div
      ref={ref}
      data-micro={microName}
      dangerouslySetInnerHTML={{ __html: (!application || application.isFirstMounted) && ele ? ele.innerHTML : `<!-- ${microName} -->` }}
    />
  );
};
