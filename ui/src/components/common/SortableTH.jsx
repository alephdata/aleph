import React from 'react';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';

import './SortableTH.scss';

function SortableTH(props) {
  const { sortable, sorted, onClick, children, className, ...otherProps } =
    props;
  if (!sortable) {
    return <th className={className}>{children}</th>;
  }
  const iconClass = c(
    'caret',
    Classes.ICON_LARGE,
    sorted === 'desc'
      ? `${Classes.ICON}-caret-down`
      : `${Classes.ICON}-caret-up`,
    { hidden: !sorted }
  );
  return (
    <th
      className={c('SortableTH clickable', className)}
      onClick={onClick}
      {...otherProps}
    >
      <div>
        {children}
        <span className={iconClass} />
      </div>
    </th>
  );
}

export default SortableTH;
