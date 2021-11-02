import MatList from '@mui/material/List';
import MatListItem from '@mui/material/ListItem';
import MatListItemIcon from '@mui/material/ListItemIcon';
import MatListItemText from '@mui/material/ListItemText';
import Icon from '@mui/material/Icon';
import React from 'react';
import { ElementProps } from '../../builder-element';

interface IconListProps extends ElementProps {
  id: string;
  icon: string;
  text: string;
  component: 'li' | 'a';
  className: string;
}

export const IconList = (props: IconListProps) => {
  const { className, component = 'li', instance, source = [], events = {} } = props;
  const childrens = source.map((s: any, index: number) => {
    return (
      <MatListItem component={component} button key={s.key || index} onClick={events?.onSelect?.bind(undefined, s)}>
        <MatListItemIcon><Icon>{s.icon}</Icon></MatListItemIcon>
        <MatListItemText>{s.text}</MatListItemText>
      </MatListItem>
    );
  });

  return (
    <MatList className={className} ref={instance}>{childrens}</MatList>
  );
};
