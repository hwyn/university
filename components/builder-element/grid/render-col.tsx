import MatGrid from '@mui/material/Grid';
import React, { ReactElement } from 'react';
import { RenderElement } from './render-element';
import { RenderPropsModel } from './type-api';

export const RenderCol = ({ fields = [], builder }: RenderPropsModel): ReactElement => {
  const children = fields.map((builderField: any) => {
    const { key, id, layout: { column } } = builderField;
    return (
      <MatGrid item xs={column} key={key || id}>
        <RenderElement field={builderField} builder={builder} />
      </MatGrid>
    );
  });
  return <>{children}</>;
};
