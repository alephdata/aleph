import React from 'react';
import classnames from 'classnames';
import { Drawer } from '@blueprintjs/core';


import './Preview.scss';


class Preview extends React.Component {
  render() {
    const { hidden, children } = this.props;
    const className = classnames('Preview', { hidden });
    return (
      <Drawer
        className={className}
        isOpen={!hidden}
        autoFocus={false}
        canOutsideClickClose
        canEscapeKeyClose
        enforceFocus={false}
        hasBackdrop={false}
      >
        {children}
      </Drawer>
    );
  }
}

export default Preview;
