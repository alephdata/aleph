import React from 'react';
import c from 'classnames';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import './CheckboxList.css';

const CheckboxList = ({ items, selectedItems, onItemClick, children }) => (
  <ul className="CheckboxList">
    {items && items.length === 0 && (
      <li className="faint">
        <FormattedMessage id="search.facets.no_items"
                          defaultMessage="No options"/>
      </li>
    )}
    {items && items.map(item => (
      <li className={c('clickable', {'active': selectedItems.includes(item.id)})}
        onClick={() => onItemClick(item.id)}
        key={item.id}>
        
        <span className={c('bp3-icon-standard', 'Tick')} />
        <span className="label" title={item.label}>{item.label}</span>
        {item.count !== undefined && (
          <span className="count">
            <FormattedNumber value={item.count} />
          </span>
        )}

      </li>
    ))}
    {children && (
      <li>
        {children}
      </li>
    )}
  </ul>
);

export default CheckboxList;
