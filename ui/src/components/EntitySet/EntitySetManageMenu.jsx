import React, { Component } from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, ControlGroup, Divider, Menu, MenuItem, Popover } from '@blueprintjs/core';

import { SearchBox } from 'components/common';
import EntitySetEditDialog from 'dialogs/EntitySetEditDialog/EntitySetEditDialog';
import EntitySetDeleteDialog from 'dialogs/EntitySetDeleteDialog/EntitySetDeleteDialog';

import './EntitySetManageMenu.scss';

const messages = defineMessages({
  placeholder: {
    id: 'entity_set.menu.search_placeholder',
    defaultMessage: 'Search in {set_name}',
  },
});

class EntitySetManageMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editIsOpen: false,
      deleteIsOpen: false,
    };
    this.toggleEdit = this.toggleEdit.bind(this);
    this.toggleDelete = this.toggleDelete.bind(this);
  }

  toggleDelete = () => this.setState(({ deleteIsOpen }) => ({ deleteIsOpen: !deleteIsOpen }));

  toggleEdit = () => this.setState(({ editIsOpen }) => ({ editIsOpen: !editIsOpen }));

  renderMenu() {
    const { triggerDownload } = this.props;

    return (
      <Menu>
        <MenuItem icon="export" onClick={triggerDownload} text={
          <FormattedMessage id="entityset.info.export" defaultMessage="Export" />
        } />
        <MenuItem icon="trash" onClick={this.toggleDelete} text={
          <FormattedMessage id="entityset.info.delete" defaultMessage="Delete" />
        } />
      </Menu>
    );
  }

  render() {
    const { entitySet, intl, onSearch, triggerDownload } = this.props;
    const { editIsOpen, deleteIsOpen } = this.state;
    const showMenu = entitySet.type === 'diagram';

    return (
      <>
        <ControlGroup className="EntitySetManageMenu">
          {onSearch && (
            <SearchBox
              onSearch={onSearch}
              placeholder={intl.formatMessage(messages.placeholder, { set_name: entitySet.label })}
            />
          )}
          {onSearch && (entitySet.writeable || triggerDownload) && <Divider />}
          {entitySet.writeable && (
            <ButtonGroup>
              <Button icon="cog" onClick={this.toggleEdit}>
                <FormattedMessage id="entityset.info.edit" defaultMessage="Settings" />
              </Button>
              {!showMenu && (
                <Button icon="trash" onClick={this.toggleDelete}>
                  <FormattedMessage id="entityset.info.delete" defaultMessage="Delete" />
                </Button>
              )}
              {showMenu && (
                <Popover minimal content={this.renderMenu()}>
                  <Button rightIcon="caret-down" />
                </Popover>
              )}
            </ButtonGroup>
          )}
          {!entitySet.writeable && triggerDownload && (
            <Button icon="export" onClick={triggerDownload}>
              <FormattedMessage id="entityset.info.export" defaultMessage="Export" />
            </Button>
          )}
        </ControlGroup>
        <EntitySetEditDialog
          entitySet={entitySet}
          isOpen={editIsOpen}
          toggleDialog={this.toggleEdit}
          canChangeCollection={false}
        />
        <EntitySetDeleteDialog
          isOpen={deleteIsOpen}
          entitySet={entitySet}
          toggleDialog={this.toggleDelete}
        />
      </>
    );
  }
}

EntitySetManageMenu = injectIntl(EntitySetManageMenu);
export default EntitySetManageMenu;
