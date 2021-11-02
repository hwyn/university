import MuiInput, { InputProps as MuiInputProps } from '@mui/material/Input';
import React from 'react';
import { ElementProps } from '../../builder-element';

export interface InputProps extends MuiInputProps, ElementProps {
  type: any;
  id: string;
}

export const Input = (props: InputProps) => {
  const { id, instance, control, events, ...others } = props;
  return (
    <MuiInput ref={instance} value={control?.value} error={control?.valid} {...events} {...others} />
  );
};
