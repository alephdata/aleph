import React, { PureComponent } from 'react';
import { Alignment, Button, Intent, MenuItem } from '@blueprintjs/core';

import { Count, SelectWrapper } from 'components/common';

class SortingBarSelect extends PureComponent {
  renderOption = (option, { handleClick }) => (
    <MenuItem
      key={option.field || 'all'}
      onClick={handleClick}
      text={option.label}
      label={option.count && <Count count={option.count} />}
    />
  );

  render() {
    const { activeItem, items, onSelect } = this.props;

    return (
      <SelectWrapper
        itemRenderer={this.renderOption}
        items={items}
        onItemSelect={onSelect}
        activeItem={activeItem}
        popoverProps={{
          minimal: true,
          fill: false,
          className: 'SortingBar__item__popover',
        }}
        inputProps={{
          fill: false,
        }}
        filterable={false}
        resetOnClose
        resetOnSelect
      >
        <Button
          text={activeItem.label}
          alignText={Alignment.LEFT}
          minimal
          intent={Intent.PRIMARY}
          rightIcon="caret-down"
        />
      </SelectWrapper>
    );
  }
}

export default SortingBarSelect;
