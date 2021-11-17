import { createElement, useEffect, useRef } from 'react';
import { useMicro } from './hooks/use-micro';

interface MicroProps { [key: string]: any; }

export const forwardMicro = (microName: string) => ({ instance, ...props }: MicroProps) => {
  const ref = useRef<any>();
  const application = useMicro(microName);

  useEffect(() => {
    if (!application || !ref.current) {
      return;
    }
    const continer = ref.current;
    if (instance) {
      instance.current = application;
    }
    application.onMounted(ref.current, props);
    return () => { application.unMounted(continer); };
  }, [ref.current, application]);

  return createElement(`${microName}-tag`, { ref });
};
