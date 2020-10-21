import React, { Component } from 'react';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, ControlGroup, Divider, Menu, MenuItem, Popover } from '@blueprintjs/core';

import { SearchBox } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import EntitySetEditDialog from 'dialogs/EntitySetEditDialog/EntitySetEditDialog';
import EntitySetDeleteDialog from 'dialogs/EntitySetDeleteDialog/EntitySetDeleteDialog';

import './EntitySetManageMenu.scss';

const messages = defineMessages({
  placeholder: {
    id: 'entity_set.menu.search_placeholder',
    defaultMessage: 'Search in {set_name}',
  },
  edit: {
    id: 'entityset.info.edit',
    defaultMessage: 'Settings',
  },
  delete: {
    id: 'entityset.info.delete',
    defaultMessage: 'Delete',
  },
});

class EntitySetManageMenu extends Component {
  renderMenu() {
    const { entitySet, intl, triggerDownload } = this.props;

    return (
      <Menu>
        <MenuItem icon="export" onClick={triggerDownload} text={
          <FormattedMessage id="entityset.info.export" defaultMessage="Export" />
        } />
        <DialogToggleButton
          ButtonComponent={MenuItem}
          buttonProps={{
            text: intl.formatMessage(messages.delete),
            icon: "trash",
            shouldDismissPopover: false
          }}
          Dialog={EntitySetDeleteDialog}
          dialogProps={{ entitySet }}
        />
      </Menu>
    );
  }

  render() {
    const { entitySet, intl, onSearch, triggerDownload } = this.props;
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
              <DialogToggleButton
                buttonProps={{
                  text: intl.formatMessage(messages.edit),
                  icon: "cog"
                }}
                Dialog={EntitySetEditDialog}
                dialogProps={{ entitySet, canChangeCollection: false }}
              />
              {!showMenu && (
                <DialogToggleButton
                  buttonProps={{
                    text: intl.formatMessage(messages.delete),
                    icon: "trash"
                  }}
                  Dialog={EntitySetDeleteDialog}
                  dialogProps={{ entitySet }}
                />
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
      </>
    );
  }
}

EntitySetManageMenu = injectIntl(EntitySetManageMenu);
export default EntitySetManageMenu;
