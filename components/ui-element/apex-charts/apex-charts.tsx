import { isEmpty } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { ElementProps } from '../../builder-element';
import { LazyComponent } from '../../lazy-component/lazy-component';

interface ApexChartsProps extends ElementProps {
  module: any;
  height: number;
  className: string;
}

const LibApexCharts = (props: ApexChartsProps) => {
  const ref = useRef() as React.MutableRefObject<HTMLDivElement>;
  const { className } = props;
  useEffect(() => {
    const { source = {}, height = source.chart?.height, events = {}, instance } = props;
    if (!isEmpty(source)) {
      source.chart = { events, ...source.chart, height };
      const chart = new props.module.default(ref.current, source);
      instance.current = chart;
      chart.render();
      return () => chart.destroy();
    }
  }, [ref.current]);

  return <div ref={ref} className={className} />;
};

export const ApexCharts = LazyComponent(() => import('apexcharts'), LibApexCharts);
