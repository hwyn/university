import MatBadge, { BadgeProps as MatBadgeProps } from '@mui/material/Badge';
import MatIconButton from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';
import React from 'react';
import { ElementProps } from '../../builder-element';

interface BadgeProps extends MatBadgeProps, ElementProps {
  id: string;
  icon?: string;
  className?: string;
}

export const IconBadge = (props: BadgeProps) => {
  const {
    id,
    icon,
    instance,
    events,
    control,
    badgeContent = ``,
    ...other
  } = props;

  return (
    <MatIconButton {...events}>
      <MatBadge
        ref={instance}
        badgeContent={control?.value || badgeContent}
        {...other}
      >
        { icon ? <Icon>{icon}</Icon> : null }
      </MatBadge>
    </MatIconButton>
  );
};
