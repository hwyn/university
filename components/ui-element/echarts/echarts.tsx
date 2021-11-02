import { isEmpty } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { ElementProps } from '../../builder-element';
import { LazyComponent } from '../../lazy-component/lazy-component';
import styles from './echarts.scss';

interface EchartsProps extends ElementProps {
  width: number;
  height: number;
  className?: string;
  module: any;
}

const LibEcharts = (props: EchartsProps) => {
  const ref = useRef() as React.MutableRefObject<HTMLDivElement>;
  const { id, module: { echarts }, className, width, height, instance, source = {}, events, ...others } = props;
  const defaultStyle = { width: `${width}px`, height: `${height}px` };
  useEffect(() => {
    if (isEmpty(ref.current) || isEmpty(source)) {
      return;
    }
    const { current } = ref;
    const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
    let rects = current.getClientRects()[0];
    const myChart = echarts.init(current, undefined, {
      devicePixelRatio,
      width: rects.width,
      height: height || rects.height
    });
    const resetSize = () => {
      rects = current.getClientRects()[0];
      myChart.resize({ width: rects.width, height: height || rects.height });
    };

    myChart.setOption(source);
    instance.current = myChart;
    window.addEventListener('resize', resetSize, false);
    return () => {
      window.removeEventListener('resize', resetSize);
      myChart.dispose();
    };
  }, []);

  return <div ref={ref} style={defaultStyle} className={[styles.convas, className].join(' ')} {...events} {...others} />;
};

export const Echarts = LazyComponent(() => import('./echarts.lib'), LibEcharts);
