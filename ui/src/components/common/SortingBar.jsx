import React, { PureComponent } from 'react';
// import c from 'classnames';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Alignment, Button, ControlGroup, Intent, MenuItem } from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import './SortingBar.scss';
//
// const messages = defineMessages({
//   placeholder: {
//     id: 'collection.index.sort.label',
//     defaultMessage: 'Sort by:',
//   },
// });

class SortingBar extends PureComponent {
  renderOption = (option, { handleClick }) => (
    <MenuItem
      key={option.field}
      onClick={handleClick}
      text={option.label}
    />
  )

  render() {
    const { activeDirection, activeSort, onSort, sortingOptions } = this.props;
    return (
      <div className="SortingBar">
        <div className="SortingBar__content">
          <span className="SortingBar__label">
            <FormattedMessage
              id="collection.index.sort.label"
              defaultMessage="Sort by:"
            />
          </span>
          <ControlGroup fill={false} className="SortingBar__controls">
            <Select
              itemRenderer={this.renderOption}
              items={sortingOptions}
              onItemSelect={onSort}
              activeItem={activeSort}
              popoverProps={{
                minimal: true,
                fill: false,
              }}
              inputProps={{
                fill: false,
              }}
              filterable={false}
              resetOnClose
              resetOnSelect
            >
              <Button
                text={activeSort.label}
                rightIcon="caret"
                alignText={Alignment.LEFT}
                minimal
                intent={Intent.PRIMARY}
                className="SortingBar__controls__select"
              />
            </Select>
            <Button
              icon={activeDirection === 'desc' ? 'caret-down' : 'caret-up'}
              onClick={() => onSort({ direction: activeDirection === 'desc' ? 'asc' : 'desc' })}
              minimal
              intent={Intent.PRIMARY}
            />
          </ControlGroup>
        </div>
      </div>
    );
  }
}

export default injectIntl(SortingBar);
