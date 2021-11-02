import MatCard, { CardProps as MatCardProps } from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import React, { ReactElement } from 'react';
import { Builder, ElementProps } from '../../builder-element';
import { useStyles } from './mat-scss';

export interface BuilderCardCardProps extends ElementProps, MatCardProps {
  id: string;
  jsonName: string;
  config?: any;
  children?: ReactElement;
}

export const BuilderCard = (props: BuilderCardCardProps) => {
  const {
    id,
    builder,
    jsonName,
    className,
    instance,
    events,
    config,
    children,
    variant = 'elevation',
    ...others
  } = props;
  const classes = useStyles();

  return (
    <MatCard elevation={3} className={[classes.root, className].join(' ')} {...events} variant={variant} {...others}>
      <CardContent className={classes.content}>
        <Builder id={id} instance={instance} jsonName={jsonName} builder={builder} config={config}>
          {children}
        </Builder>
      </CardContent>
    </MatCard>
  );
};
