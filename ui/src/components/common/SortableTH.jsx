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
      const iconClass = c(className, 'caret', 'pt-icon-large',
        `pt-icon-caret-${sorted === 'desc' ? 'up' : 'down'}`,
        { 'hidden': !sorted },
      );
      return (
        <th className="SortableTH" onClick={onClick} {...otherProps}>
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
