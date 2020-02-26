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
          <div className="SortingBar__item">
            <span className="SortingBar__label">
              <FormattedMessage
                id="collection.index.sort.label"
                defaultMessage="Sort by:"
              />
            </span>
            <div className="SortingBar__control">
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
                  alignText={Alignment.LEFT}
                  minimal
                  intent={Intent.PRIMARY}
                  rightIcon="caret-down"
                  className="SortingBar__control__select"
                />
              </Select>
            </div>
          </div>
          <div className="SortingBar__item">
            <span className="SortingBar__label">
              <FormattedMessage
                id="collection.index.sort.label"
                defaultMessage="Direction:"
              />
            </span>
            <div className="SortingBar__control">
              <Button
                icon={activeDirection === 'desc' ? 'arrow-down' : 'arrow-up'}
                onClick={() => onSort({ direction: activeDirection === 'desc' ? 'asc' : 'desc' })}
                minimal
                intent={Intent.PRIMARY}
              />
            </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(SortingBar);
