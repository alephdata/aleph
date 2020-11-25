
import React, { PureComponent } from 'react';
import { injectIntl, defineMessages } from 'react-intl';
import { Button, ButtonGroup, Intent, Popover, Menu, MenuItem } from '@blueprintjs/core';

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
    const { collection, intl, buttonProps = {} } = this.props;
    return (
      <Menu>
        <DialogToggleButton
          ButtonComponent={MenuItem}
          buttonProps={{
            text: intl.formatMessage(messages.reingest),
            icon: "automatic-updates",
            shouldDismissPopover: false,
            ...buttonProps
          }}
          Dialog={CollectionReingestAlert}
          dialogProps={{ collection }}
        />
        <DialogToggleButton
          ButtonComponent={MenuItem}
          buttonProps={{
            text: intl.formatMessage(messages.reindex),
            icon: "search-template",
            shouldDismissPopover: false,
            ...buttonProps
          }}
          Dialog={CollectionReindexAlert}
          dialogProps={{ collection }}
        />
        <DialogToggleButton
          ButtonComponent={MenuItem}
          buttonProps={{
            text: intl.formatMessage(messages[collection.casefile ? 'delete_casefile' : 'delete']),
            icon: "trash",
            shouldDismissPopover: false,
            intent: Intent.DANGER,
            ...buttonProps
          }}
          Dialog={CollectionDeleteDialog}
          dialogProps={{ collection }}
        />
      </Menu>
    );
  }

  render() {
    const { collection, intl, buttonGroupProps = {}, buttonProps = {} } = this.props;
    if (!collection.writeable) {
      return null;
    }
    return (
      <ButtonGroup fill {...buttonGroupProps}>
        <DialogToggleButton
          buttonProps={{
            text: intl.formatMessage(messages.edit),
            icon: "cog",
            ...buttonProps
          }}
          Dialog={CollectionEditDialog}
          dialogProps={{ collection }}
        />
        <DialogToggleButton
          buttonProps={{
            text: intl.formatMessage(messages.access),
            icon: "key",
            ...buttonProps
          }}
          Dialog={CollectionAccessDialog}
          dialogProps={{ collection }}
        />
        <Popover>
          <Button icon="caret-down" {...buttonProps} />
          {this.renderMenu()}
        </Popover>
      </ButtonGroup>
    );
  }
}

CollectionManageMenu = injectIntl(CollectionManageMenu);
export default CollectionManageMenu;
