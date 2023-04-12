import { FC, useEffect, useState, useRef } from 'react';
import c from 'classnames';

import './WidthBoundary.scss';

type WidthBoundaryProps = {
  align?: 'start' | 'end';
};

/**
 * Sometimes we do not want an element to change it's width after the initial render,
 * for example because that would shift other elements around. When used as a wrapper,
 * this component ensure the width doesn't change after the initial render. If the
 * width increases after the initial render, children will overflow.
 */
const WidthBoundary: FC<WidthBoundaryProps> = ({
  children,
  align = 'start',
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    setWidth(elementRef.current?.clientWidth || null);
  }, []);

  return (
    <div
      className={c(['WidthBoundary', `WidthBoundary--${align}`])}
      ref={elementRef}
      style={{ width: width ? `${width}px` : undefined }}
    >
      {children}
    </div>
  );
};

export default WidthBoundary;
