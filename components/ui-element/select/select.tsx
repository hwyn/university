import MenuItem from '@mui/material/MenuItem';
import MatSelect, { SelectProps as MatSelectProps } from '@mui/material/Select';
import React from 'react';
import { ElementProps } from '../../builder-element';
import { BootstrapInput } from './mat-scss';

export interface SelectProps extends ElementProps, MatSelectProps {
  id: string;
}

export const Select = (props: SelectProps) => {
  const { ls, instance, source = [], events, control, container, ...others } = props;
  const options = source.map(({ key, value, label }: any, index: number) => (
    <MenuItem key={key || index} value={value}>{label}</MenuItem>
  ));
  return (
    <MatSelect
      ref={instance}
      value={control?.value}
      MenuProps={{container}}
      input={<BootstrapInput />}
      {...events}
      {...others}
    >
      {options}
    </MatSelect >
  );
};
