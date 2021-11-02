import MuiButton, { ButtonProps as MatButtonProps } from '@mui/material/Button';
import React from 'react';
import { ElementProps } from '../../builder-element';

export interface ButtonProps extends MatButtonProps, ElementProps {
  id: string;
  type: any;
  text: string;
}

export const Button = (props: ButtonProps) => {
  const { instance, events, text = ``, color = 'primary', variant = 'contained', ...others } = props;
  return (
    <MuiButton ref={instance} {...events} variant={variant} color={color} {...others}>{text}</MuiButton>
  );
};
