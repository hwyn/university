import { getProvider } from '@di';
import { isEmpty } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { filter } from 'rxjs/operators';
import { MICRO_MANAGER } from './token';
import { MicroManageInterface, MicroStoreInterface } from './types';

export const forwardMicro = (microName: string) => () => {
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
      application.onMounted(ref.current);
      return () => { application.unMounted(ref.current); };
    }
  }, [ref.current, application]);
  return (
    <div data-micro={microName} dangerouslySetInnerHTML={{ __html: ele ? ele.innerHTML : `<!-- ${microName} -->` }} ref={ref} />
  );
};
