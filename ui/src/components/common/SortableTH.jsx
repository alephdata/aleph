// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
