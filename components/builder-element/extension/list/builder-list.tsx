import React from 'react';
import { ElementProps } from '../../builder';
import { RenderFields } from '../../grid';
import { useBuilder } from '../../hooks';

const RenderBuilderList = (props: any) => {
  const { config, instance, builder, additional } = props;
  const listBuilder = useBuilder<any>({ id: props.id, builder, config });
  instance.current = listBuilder;
  return <RenderFields fields={listBuilder.fields} builder={listBuilder} additional={additional} />;
};

export const factoryListComponent = (constProps: any) => function List(props: ElementProps) {
  const { source = [], builder, instance } = props;
  const { fieldTemplate: { dataSource, ...fieldTemplate }, additional } = constProps;

  const config: any = {
    fields: source.map((s: any, index: number) => ({
      ...fieldTemplate,
      metadata: { targetIndex: index },
      dataSource: { ...dataSource, source: s },
      id: `${fieldTemplate.id}-${s.id || s.key || index}`
    }))
  };

  return <RenderBuilderList config={config} instance={instance} builder={builder} additional={additional} />;
};
