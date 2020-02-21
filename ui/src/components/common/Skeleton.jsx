import React, { PureComponent } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

// import './Skeleton.scss';

class Skeleton extends PureComponent {
  renderTextSkeleton() {
    const { width, height } = this.props;

    return (
      <span style={{ width, height }} className={Classes.SKELETON} />
    );
  }
  render() {
    const { type, isLoading, children } = this.props;

    if (!isLoading) {
      return children;
    }

    switch(type) {
      case 'span':
        return this.renderTextSkeleton();
    }

  }
}

export default Skeleton;
