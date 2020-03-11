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
    return (
      <div className="LayoutSkeleton column-container">
        <div className={Classes.SKELETON} />
        <div className={Classes.SKELETON} />
        <div className={Classes.SKELETON} />
        <div className={Classes.SKELETON} />
      </div>
    );
  }
}

class Skeleton {
  static Text = TextSkeleton;

  static Layout = LayoutSkeleton;
}


export default Skeleton;
