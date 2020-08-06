import React, { Component } from 'react';
import { Boundary, Button, ButtonGroup, ControlGroup, OverflowList, Popover } from '@blueprintjs/core';

import { SearchBox } from 'components/common';

import './EntityActionBar.scss';

class EntityActionBar extends Component {
  overflowListRenderer = (overflowItems) => {
    const menuContent = overflowItems.map((item, i) => <React.Fragment key={i}>{item}</React.Fragment>);
    return (
      <Popover
        content={<ButtonGroup vertical minimal alignText="left">{menuContent}</ButtonGroup>}
        position="bottom-left"
        minimal
        popoverClassName="EntityActionBar__overflow-list"
        boundary="viewport"
      >
        <Button icon="caret-down" />
      </Popover>
    );
  }

  render() {
    const { children, query, onSearchSubmit, searchDisabled, searchPlaceholder, writeable } = this.props;

    return (
      <>
        <ControlGroup className="EntityActionBar">
          {writeable && (
            <OverflowList
              items={children}
              collapseFrom={Boundary.END}
              visibleItemRenderer={(item, i) => <React.Fragment key={i}>{item}</React.Fragment>}
              overflowRenderer={this.overflowListRenderer}
              className="bp3-button-group"
              observeParents
            />
          )}
          <SearchBox
            onSearch={onSearchSubmit}
            placeholder={searchPlaceholder}
            query={query}
            inputProps={{ disabled: searchDisabled }}
          />
        </ControlGroup>
      </>
    );
  }
}

export default EntityActionBar;
