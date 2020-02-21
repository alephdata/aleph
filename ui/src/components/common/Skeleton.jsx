import React, { PureComponent } from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

// import './Skeleton.scss';

class Skeleton extends PureComponent {
  render() {
    const { type, width, isLoading, children } = this.props;

    if (!isLoading) {
      return children;
    }

    switch(type) {
      case 'h1':
        return <h1 style={{ width, height: '35px' }} className={Classes.SKELETON} />;

      case 'p':
        return <p style={{ width, height: '18px' }} className={Classes.SKELETON} />;

      case 'span':
        return <span style={{ width, height: '18px' }} className={Classes.SKELETON} />;

    }

  }
}

export default Skeleton;
