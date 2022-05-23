import { cloneDeep, groupBy, merge, toArray } from 'lodash';

import { LATOUT_ID } from '../constant/calculator.constant';
import { BuilderModelExtensions, GridType } from '../type-api';

const defaultGrid: GridType = {
  spacing: 0,
  justify: 'flex-start',
  alignItems: 'flex-start',
  groups: [12]
};

function groupByFields(fields: any[]): { [key: string]: any[] } {
  return groupBy(fields, ({ layout: { group } }: any) => group);
}

function groupFieldsToArray(fields: any): any[] {
  return toArray(groupBy(fields, ({ layout: { row } }) => row));
}

export class Grid {
  private config: GridType;
  constructor(private builder: BuilderModelExtensions, json: any) {
    this.config = this.serializationConfig(json.grid);
  }

  private serializationConfig(gridConfig: any) {
    const { id = LATOUT_ID, groups, additional = [], ...other } = merge(cloneDeep(defaultGrid), gridConfig);
    const { justify, alignItems, spacing } = other;
    const groupLayout = groupBy(additional, ({ group }) => group);
    const defaultGroupAdditional = { justify, alignItems, spacing };
    const groupAdditional = groups.map((xs: string, index: number) => {
      const [item = {}] = groupLayout[index + 1] || [];
      return { xs, ...defaultGroupAdditional, ...item };
    });

    return { id, ...other, additional: groupAdditional };
  }

  public getViewGrip(props: any): GridType {
    const config = cloneDeep(this.config);
    const { additional = [], className = '', style } = config;
    const { className: propsClassName = '', style: propsStyle } = props;
    const groupLayout = groupByFields(this.builder.fields);
    additional.forEach((item: any, group: number) => item.fieldRows = groupFieldsToArray(groupLayout[group + 1]));
    if (className || propsClassName) {
      config.className = [className, propsClassName].join(' ');
    }
    if (style || propsStyle) {
      config.style = Object.assign({}, style, propsStyle);
    }
    return config;
  }
}
