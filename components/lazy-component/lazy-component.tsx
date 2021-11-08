import MatSkeleton from '@mui/material/Skeleton';
import React, { useEffect, useState } from 'react';

export const LazyComponent = (lazy: () => Promise<object>, Component: any) => (props: any) => {
  const [ loadModule, setModel ] = useState(false);
  const { height = 50 } = props;
  useEffect(() => {
    lazy().then((module) => setModel(module as any));
  }, []);

  return !loadModule ? <MatSkeleton variant='rectangular' height={height} /> : <Component module={loadModule} {...props} />;
};
