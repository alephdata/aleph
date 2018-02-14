import React from 'react';
import c from 'classnames';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import './CheckboxList.css';

const Tick = ({ isTicked }) => (
  <span className={c('pt-icon-standard', 'Tick', {'is-ticked': isTicked})} />
)

const CheckboxList = ({ items, selectedItems, onItemClick }) => (
  <ul className="CheckboxList">
    {items.length === 0 && (
      <li className="faint">
        <FormattedMessage id="search.filter.no.items"
                          defaultMessage="No options"/>
      </li>
    )}
    {items
      .map(item => (
        <li className="clickable" onClick={() => onItemClick(item.id)} key={item.id}>
          <Tick isTicked={selectedItems.includes(item.id)} />
          <span className="label" title={item.label}>{item.label}</span>
          {item.count !== undefined && (
            <span className="count"><FormattedNumber value={item.count} /></span>
          )}
        </li>
      ))}
  </ul>
);

export default CheckboxList;
