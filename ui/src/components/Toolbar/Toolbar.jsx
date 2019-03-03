import React from 'react';
import classnames from 'classnames';

import './Toolbar.scss';

export default class extends React.PureComponent {
  render() {
    return (
      <div className={classnames('Toolbar', this.props.className)}>
        {this.props.children}
      </div>
    );
  }
}
