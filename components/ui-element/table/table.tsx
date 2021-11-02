import MatCheckbox from '@mui/material/Checkbox';
import MatTable, { TableProps as MatTableProps } from '@mui/material/Table';
import MatTableBody from '@mui/material/TableBody';
import MatTableCell from '@mui/material/TableCell';
import MatTableContainer from '@mui/material/TableContainer';
import MatTableHead from '@mui/material/TableHead';
import MatTableRow from '@mui/material/TableRow';
import { BuilderModelExtensions, BuilderModelImplements } from 'dynamic-builder';
import React, { ElementType } from 'react';
import { ElementProps, RenderElement, useBuilder } from '../../builder-element';

interface EnhancedTableHeadProps {
  medadataCells: any[];
  isCheckbox?: boolean;
}

const EnhancedTableHead = (props: EnhancedTableHeadProps) => {
  const { medadataCells = [], isCheckbox } = props;
  const cellList = medadataCells.map(({ metadata: { width = ``, label = `` } = {} }: any, index: number) => (
    <MatTableCell width={width} key={`thead-${index}`}>{label}</MatTableCell>
  ));
  return (
    <MatTableRow>
      {isCheckbox ? <MatTableCell padding='checkbox'><MatCheckbox /></MatTableCell> : null}
      {cellList}
    </MatTableRow>
  );
};

interface EnhancedBodyRowProps extends EnhancedTableHeadProps {
  id: string;
  source: any[];
  builder: BuilderModelImplements;
}

const EnhancedBodyRow = (props: EnhancedBodyRowProps) => {
  const { id, isCheckbox, medadataCells, source, builder } = props;
  const config: any = {
    actions: [{ type: 'load', handler: () => source }],
    fields: medadataCells.map(({ metadata, ...other }: any) => ({
      ...other,
      id: metadata?.key,
      metadata: { ...metadata, data: source }
    }))
  };

  const cellBuilder = useBuilder<BuilderModelExtensions>({ id, config, builder });
  const cellList = medadataCells.map(({ metadata: { key = `` } = {} }: any, index: number) => (
    <MatTableCell key={`thead-${key || index}`}>
      <RenderElement builder={cellBuilder} field={cellBuilder.getFieldById(key)} />
    </MatTableCell>
  ));

  return (
    <MatTableRow>
      {isCheckbox ? <MatTableCell padding='checkbox'><MatCheckbox /></MatTableCell> : null}
      {cellList}
    </MatTableRow>
  );
};

interface TableProps extends MatTableProps, ElementProps {
  id: string;
  medadataCells: any[];
  isCheckbox?: boolean;
  component: ElementType<any>;
}

export const Table = (props: TableProps) => {
  const {
    id,
    builder,
    instance,
    source = [],
    medadataCells = [],
    component = 'div',
    className,
    isCheckbox,
    size
  } = props;

  const rowList = source.map((s: any, index: number) => (
    <EnhancedBodyRow
      id={id}
      key={`tbody-row-${s.key || index}`}
      source={s}
      builder={builder}
      medadataCells={medadataCells}
      isCheckbox={isCheckbox}
    />
  ));

  return (
    <MatTableContainer component={component} className={className}>
      <MatTable ref={instance} size={size}>
        <MatTableHead>
          <EnhancedTableHead medadataCells={medadataCells} isCheckbox={isCheckbox} />
        </MatTableHead>
        <MatTableBody>{rowList}</MatTableBody>
      </MatTable>
    </MatTableContainer>
  );
};
