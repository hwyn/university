import MatPopover, { PopoverProps as MatPopoverProps } from '@mui/material/Popover';
import { APPLICATION_CONTAINER } from '@university/client-silde-rendering/token';
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
    ls,
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
    <MatPopover open={open} className={className} container={ls.getProvider(APPLICATION_CONTAINER)} {...events} {...others}>
      {
        open ? <Builder id={id} instance={instance} events={events} jsonName={jsonName} config={config} builder={builder} /> : null
      }
    </MatPopover>
  );
};
