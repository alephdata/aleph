import React from 'react';
import c from 'classnames';

import './SortableTH.scss';

function SortableTH(props) {
  const {
    sortable, sorted, onClick, children, className, ...otherProps
  } = props;
  if (!sortable) {
    return (
      <th className={className}>{children}</th>
    );
  }
  const iconClass = c('caret', 'bp3-icon-large',
    `bp3-icon-caret-${sorted === 'desc' ? 'down' : 'up'}`,
    { hidden: !sorted });
  return (
    <th className={c('SortableTH clickable', className)} onClick={onClick} {...otherProps}>
      <div>
        {children}
        <span className={iconClass} />
      </div>
    </th>
  );
}


export default SortableTH;
