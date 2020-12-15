import React, { PureComponent } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import './Skeleton.scss';

class TextSkeleton extends PureComponent {
  render() {
    const { className, length, type } = this.props;
    const placeholder = '-'.repeat(length);

    return React.createElement(
      type,
      { className: c(Classes.SKELETON, className) },
      placeholder,
    );
  }
}

class LayoutSkeleton extends PureComponent {
  render() {
    const { itemHeight, colCount, type } = this.props;

    const columns = colCount ? [...Array(colCount).keys()] : [];

    console.log('columns', columns)

    switch (type) {
      default:
        return (
          <div className="LayoutSkeleton multi-column">
            {columns.map((i) => (
              <div className={Classes.SKELETON} key={i} style={{ height: itemHeight }} />
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
