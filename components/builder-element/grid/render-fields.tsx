import MatGrid from '@mui/material/Grid';
import { BuilderModelImplements } from 'dynamic-builder';
import { groupBy, toArray } from 'lodash';
import React, { ReactElement } from 'react';
import { RenderCol } from './render-col';
import { RenderPropsModel } from './type-api';

function groupFieldsToArray(this: BuilderModelImplements, fields: any): any[] {
  return toArray(groupBy(fields, ({ layout: { row } }) => row));
}

export const RenderFields = ({
  fields = [],
  builder,
  additional = {},
  className: propsClassName = '',
  events
}: RenderPropsModel): ReactElement => {
  const fieldGroup = groupFieldsToArray.call(builder, fields);
  const { justify, alignItems, spacing } = additional;
  const children = fieldGroup.map((rowFields, rowIndex) => (
    <MatGrid
      container
      key={rowIndex}
      justifyContent={justify}
      alignItems={alignItems}
      data-row={rowIndex + 1}
      className={propsClassName}
      spacing={spacing}
      {...events}
    >
      <RenderCol fields={rowFields} builder={builder} />
    </MatGrid>
  ));
  return <>{children}</>;
};
