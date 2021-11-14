import { getProvider } from '@di';
import { isEmpty } from 'lodash';
import { useState } from 'react';
import { filter } from 'rxjs/operators';
import { MICRO_MANAGER } from '../token';
import { MicroManageInterface, MicroStoreInterface } from '../types';

export const useMicro = (microName: string): MicroStoreInterface => {
  const manageMicro = getProvider<MicroManageInterface>(MICRO_MANAGER);
  let _setApplication: any = void (0);
  let applicationMicro: MicroStoreInterface = void(0) as any;
  manageMicro.bootstrapMicro(microName).pipe(filter((result => !isEmpty(result)))).subscribe((result) => {
    _setApplication ? _setApplication(result) : applicationMicro = result;
  });
  const [application, setApplication] = useState(applicationMicro);
  _setApplication = setApplication;

  return application;
};
