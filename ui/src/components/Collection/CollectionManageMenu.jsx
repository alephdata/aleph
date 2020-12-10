import React, { PureComponent } from 'react';
import { injectIntl, defineMessages } from 'react-intl';
import { Button, ButtonGroup, Popover, Menu, MenuItem } from '@blueprintjs/core';

import { DialogToggleButton } from 'components/Toolbar'
import CollectionEditDialog from 'dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionDeleteDialog from 'dialogs/CollectionDeleteDialog/CollectionDeleteDialog';
import CollectionReingestAlert from './CollectionReingestAlert';
import CollectionReindexAlert from './CollectionReindexAlert';


const messages = defineMessages({
  access: {
    id: 'collection.info.access',
    defaultMessage: 'Share',
  },
  edit: {
    id: 'collection.info.edit',
    defaultMessage: 'Settings',
  },
  delete: {
    id: 'collection.info.delete',
    defaultMessage: 'Delete dataset',
  },
  delete_casefile: {
    id: 'collection.info.delete_casefile',
    defaultMessage: 'Delete investigation',
  },
  reingest: {
    id: 'collection.info.reingest',
    defaultMessage: 'Re-ingest documents',
  },
  reindex: {
    id: 'collection.info.reindex',
    defaultMessage: 'Re-index all content',
  },
});


class CollectionManageMenu extends PureComponent {
  renderMenu() {
    const { collection, intl } = this.props;
    return (
      <Menu>
        <DialogToggleButton
          ButtonComponent={MenuItem}
          buttonProps={{
            text: intl.formatMessage(messages.reingest),
            icon: "automatic-updates",
            shouldDismissPopover: false
          }}
          Dialog={CollectionReingestAlert}
          dialogProps={{ collection }}
        />
        <DialogToggleButton
          ButtonComponent={MenuItem}
          buttonProps={{
            text: intl.formatMessage(messages.reindex),
            icon: "search-template",
            shouldDismissPopover: false
          }}
          Dialog={CollectionReindexAlert}
          dialogProps={{ collection }}
        />
        <DialogToggleButton
          ButtonComponent={MenuItem}
          buttonProps={{
            text: intl.formatMessage(messages[collection.casefile ? 'delete_casefile' : 'delete']),
            icon: "trash",
            shouldDismissPopover: false
          }}
          Dialog={CollectionDeleteDialog}
          dialogProps={{ collection }}
        />
      </Menu>
    );
  }

  render() {
    const { collection, intl } = this.props;
    if (!collection.writeable) {
      return null;
    }
    return (
      <>
        <ButtonGroup>
          <DialogToggleButton
            buttonProps={{
              text: intl.formatMessage(messages.edit),
              icon: "cog"
            }}
            Dialog={CollectionEditDialog}
            dialogProps={{ collection }}
          />
          <DialogToggleButton
            buttonProps={{
              text: intl.formatMessage(messages.access),
              icon: "key"
            }}
            Dialog={CollectionAccessDialog}
            dialogProps={{ collection }}
          />
          <Popover>
            <Button icon="caret-down" />
            {this.renderMenu()}
          </Popover>
        </ButtonGroup>
      </>
    );
  }
}

CollectionManageMenu = injectIntl(CollectionManageMenu);
export default CollectionManageMenu;
