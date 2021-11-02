import MatGrid from '@mui/material/Grid';
import { BuilderModelImplements } from 'dynamic-builder';
import { groupBy } from 'lodash';
import React, { ReactElement } from 'react';
import { RenderFields } from './render-fields';
import { RenderPropsModel } from './type-api';

function groupByFields(this: BuilderModelImplements, fields: any[]): { [key: string]: any[] } {
  return groupBy(fields, ({ layout: { group } }: any) => group);
}

export const BuilderLayout = ({ builder, className = '', events, grid }: RenderPropsModel): ReactElement => {
  const { fields } = builder;
  const { spacing, justify, className: gridClassName = ``, additional = [] } = grid || {};
  const mergeClassName = [className, gridClassName].join(``);

  if (additional.length <= 1) {
    return <RenderFields additional={additional[0]} events={events} fields={fields} className={mergeClassName} builder={builder} />;
  }

  const groupLayout = groupByFields.call(builder, fields);
  const children = additional.map((item: any, index: number) => (
    <MatGrid item key={`grid-${index}`} xs={item.xs || undefined} className={item.className}>
      <RenderFields additional={item} fields={groupLayout[index + 1]} builder={builder} />
    </MatGrid>
  ));
  return <MatGrid container {...events} justifyContent={justify} className={mergeClassName} spacing={spacing}>{children}</MatGrid>;
};
