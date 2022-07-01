import React from 'react';
import c from 'classnames';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Icon } from '@blueprintjs/core';

import './CheckboxList.scss';

const CheckboxList = ({
  items,
  selectedItems,
  onItemClick,
  children,
  isMultiSelect,
}) => (
  <ul className="CheckboxList">
    {items && items.length === 0 && (
      <li className="faint">
        <span>
          <FormattedMessage
            id="search.facets.no_items"
            defaultMessage="No options"
          />
        </span>
      </li>
    )}
    {items &&
      items.map((item) => {
        const isChecked = selectedItems.includes(item.id);
        const iconShape = isMultiSelect ? 'square' : 'circle';
        const icon = isChecked ? `symbol-${iconShape}` : iconShape;
        /* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
        return (
          <li
            className={c('clickable', { active: isChecked })}
            onClick={() => onItemClick(item.id)}
            onKeyDown={() => onItemClick(item.id)}
            key={item.id}
          >
            <Icon icon={icon} iconSize={12} className="tick" />
            <span className="label">{item.label}</span>
            {item.count !== undefined && (
              <span className="count">
                <FormattedNumber value={item.count} />
              </span>
            )}
          </li>
        );
      })}
    {children && <li>{children}</li>}
  </ul>
);

export default CheckboxList;
