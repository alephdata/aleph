import React from 'react';
import { castArray } from 'lodash';
import classnames from 'classnames';

import './Breadcrumbs.css';

const Breadcrumbs = ({ children = [], root }) => (
  <nav className={classnames('Breadcrumbs', {root})}>
    <ul>
      {castArray(children).map((child, i) => (
        <li key={child.key ? `breadcrumb_key_${child.key}` : `breadcrumb_nr_${i}`}>
          {child}
        </li>
      ))}
    </ul>
  </nav>
);

export default Breadcrumbs;
