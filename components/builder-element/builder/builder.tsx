import { BuilderModelImplements } from 'dynamic-builder';
import React, { useEffect } from 'react';
import { BuilderextensionProps, useBuilder } from '../hooks/use-builder';

interface BuilderProps extends BuilderextensionProps {
  children?: React.ReactElement;
}

export const Builder = (props: BuilderProps) => {
  const builder = useBuilder<BuilderModelImplements>(props);
  const { instance = {}, events = {}, className } = props;
  const { Element, ready } = builder;

  useEffect(() => {
    instance.current = builder;
    return () => instance.current = void(0);
  }, []);

  if (!Element || !ready) {
    return <></>;
  }

  return <Element className={className} builder={builder} events={events} />;
};
