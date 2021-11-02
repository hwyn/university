import MatIcon, { IconProps as MatIconProps } from '@mui/material/Icon';
import React from 'react';
import { ElementProps } from '../../builder-element';

interface IconProps extends ElementProps, MatIconProps {
  id: string;
  icon?: string;
}

export const Icon = (props: IconProps) => {
  const { instance, icon, events, ...others } = props;

  return <MatIcon ref={instance} {...events} {...others}>{icon}</MatIcon>;
};
