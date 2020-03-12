import React, { PureComponent } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import './Skeleton.scss';

class TextSkeleton extends PureComponent {
  render() {
    const { className, length, type } = this.props;
    const placeholder = "-".repeat(length);

    switch (type) {
      case 'h1':
        return (
          <h1 className={c(Classes.SKELETON, className)}>{placeholder}</h1>
        );

      case 'h6':
        return (
          <h6 className={c(Classes.SKELETON, className)}>{placeholder}</h6>
        );

      case 'p':
        return (
          <p className={c(Classes.SKELETON, className)}>{placeholder}</p>
        );

      case 'span':
        return (
          <span className={c(Classes.SKELETON, className)}>{placeholder}</span>
        );

      case 'li':
        return (
          <li className={c(Classes.SKELETON, className)}>{placeholder}</li>
        );
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
