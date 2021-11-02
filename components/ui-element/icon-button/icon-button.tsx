import MatIconButton, { IconButtonProps as MatIconButtonProps } from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';
import React from 'react';
import { ElementProps, useInvokeAction } from '../../builder-element';

export interface IconProps extends ElementProps, MatIconButtonProps {
  id: string;
  icon?: string;
  iconAction?: string;
  className?: string;
}

export const IconButton = (props: IconProps) => {
  const { id, instance, icon, iconAction, color, events, ...others } = props;
  const [iconText = icon] = useInvokeAction(iconAction, props);

  return (
    <MatIconButton ref={instance} color={color} {...events} {...others}>
      <Icon>{iconText}</Icon>
    </MatIconButton>
  );
};
