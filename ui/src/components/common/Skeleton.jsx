import React, { PureComponent } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import './Skeleton.scss';

class TextSkeleton extends PureComponent {
  render() {
    const { type, width, isLoading, children } = this.props;

    if (!isLoading) {
      return children;
    }

    switch (type) {
      case 'h1':
        return <h1 style={{ width, height: '35px' }} className={Classes.SKELETON} />;

      case 'h6':
        return <h6 style={{ width, height: '25px' }} className={Classes.SKELETON} />;

      case 'p':
        return <p style={{ width, height: '18px' }} className={Classes.SKELETON} />;

      case 'span':
        return <span style={{ width, height: '18px' }} className={Classes.SKELETON} />;

      case 'li':
        return <li style={{ width, height: '50px' }} className={Classes.SKELETON} />;
    }
  }
}

class LayoutSkeleton extends PureComponent {
  render() {
    const { itemHeight, colCount, rowCount, type } = this.props;

    const rows = rowCount ? [...Array(rowCount).keys()] : [];
    const columns = colCount ? [...Array(colCount).keys()] : [];

    switch (type) {
      case 'grid':
        return (
          <div className="LayoutSkeleton grid">
            {columns.map((i) => (
              <div className={Classes.SKELETON} key={i} style={{ height: itemHeight }} />
            ))}
          </div>
        );
      case 'multi-column':
        return (
          <div className="LayoutSkeleton multi-column">
            {columns.map((i) => (
              <div className={Classes.SKELETON} key={i} style={{ height: itemHeight }} />
            ))}
          </div>
        );
      case 'table':
        return (
          <div className="LayoutSkeleton table">
            {rows.map((x, i) => (
              <div className="table-row" key={i}>
                {columns.map((x, j) => (
                  <div className={c('table-item', Classes.SKELETON)} key={j} style={{ height: itemHeight }} />
                ))}
              </div>
            ))}
          </div>
        );
    }
  }
}

class Skeleton {
  static Text = TextSkeleton;

  static Layout = LayoutSkeleton;
}


export default Skeleton;
