import React, { Component } from 'react';
import c from 'classnames';

import './SortableTH.css';

class SortableTH extends Component {
  render() {
    const { sortable, sorted, onClick, children, className, ...otherProps } = this.props;
    if (!sortable) {
      return (
        <th>{children}</th>
      );
    } else {
      const iconClass = c('caret', 'bp3-icon-large',
        `bp3-icon-caret-${sorted === 'desc' ? 'up' : 'down'}`,
        { 'hidden': !sorted },
      );
      return (
        <th className={c('SortableTH clickable', className)} onClick={onClick} {...otherProps}>
          <div>
            {children}
            <span className={iconClass}/>
          </div>
        </th>
      );
    }
  }
}

export default SortableTH;
