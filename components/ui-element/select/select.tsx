import MenuItem from '@mui/material/MenuItem';
import MatSelect, { SelectProps as MatSelectProps } from '@mui/material/Select';
import React from 'react';
import { ElementProps } from '../../builder-element';
import { BootstrapInput } from './mat-scss';

export interface SelectProps extends ElementProps, MatSelectProps {
  id: string;
}

export const Select = (props: SelectProps) => {
  const { instance, source = [], events, control, ...others } = props;
  const options = source.map(({ key, value, label }: any, index: number) => (
    <MenuItem key={key || index} value={value}>{label}</MenuItem>
  ));

  return (
    <MatSelect
      ref={instance}
      value={control?.value}
      input={<BootstrapInput />}
      {...events}
      {...others}
    >
      {options}
    </MatSelect >
  );
};
