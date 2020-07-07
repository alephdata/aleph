import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Boundary, Button, ButtonGroup, ControlGroup, OverflowList, Popover } from '@blueprintjs/core';

import { Count, SearchBox } from 'src/components/common';
import EntityDeleteDialog from 'src/dialogs/EntityDeleteDialog/EntityDeleteDialog';

import './EntityActionBar.scss';

class EntityActionBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deleteIsOpen: false,
    };

    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
  }

  toggleDeleteSelection() {
    const { resetSelection } = this.props;
    const { deleteIsOpen } = this.state;
    if (deleteIsOpen) {
      resetSelection();
    }
    this.setState(({ deleteIsOpen: !deleteIsOpen }));
  }

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
    const { children, query, onSearchSubmit, searchPlaceholder, selection, writeable } = this.props;

    const deleteButton = (
      <Button icon="trash" onClick={this.toggleDeleteSelection} disabled={!selection.length} className="EntityActionBar__delete">
        <span className="align-middle">
          <FormattedMessage id="entity.viewer.delete" defaultMessage="Delete" />
        </span>
        <Count count={selection.length || null} />
      </Button>
    );

    return (
      <>
        <ControlGroup className="EntityActionBar">
          {writeable && (
            <OverflowList
              items={[...children, deleteButton]}
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
          />
        </ControlGroup>
        {writeable && selection && (
          <EntityDeleteDialog
            entities={selection}
            isOpen={this.state.deleteIsOpen}
            toggleDialog={this.toggleDeleteSelection}
          />
        )}
      </>
    );
  }
}

export default injectIntl(EntityActionBar);
