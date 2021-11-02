import MatPopover, { PopoverProps as MatPopoverProps } from '@mui/material/Popover';
import React from 'react';
import { Builder, ElementProps } from '../../builder-element';

interface PopoverProps extends MatPopoverProps, ElementProps {
  id: string;
  open: boolean;
  jsonName?: string;
  config?: any;
}

export const BuilderPopover = (props: PopoverProps) => {
  const {
    id,
    open = false,
    config,
    builder,
    instance,
    events,
    jsonName = ``,
    className = ``,
    ...others
  } = props;

  return (
    <MatPopover open={open} className={className} {...events} {...others}>
      {
        open ? <Builder id={id} instance={instance} events={events} jsonName={jsonName} config={config} builder={builder} /> : null
      }
    </MatPopover>
  );
};
