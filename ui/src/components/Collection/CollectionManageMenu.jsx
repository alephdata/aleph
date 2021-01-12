import React from 'react';
import { injectIntl, defineMessages } from 'react-intl';
import { Button, Popover, Menu, Intent } from '@blueprintjs/core';

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
  delete_dataset: {
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


class CollectionManageMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.toggleDialog = this.toggleDialog.bind(this);
  }

  toggleDialog(name) {
    const isOpen = this.state[name];
    this.setState({ [name]: !!!isOpen });
  }

  render() {
    const { intl, collection } = this.props;
    if (!collection?.writeable) {
      return null;
    }
    const deleteMessage = messages[collection?.casefile ? 'delete_casefile' : 'delete_dataset'];
    return (
      <>
        <Popover>
          <Button icon="cog" rightIcon="caret-down" />
          <Menu>
            <Menu.Item
              key={"edit"}
              onClick={() => this.toggleDialog('isEditOpen')}
              text={intl.formatMessage(messages.edit)}
              icon="cog"
            />
            <Menu.Item
              key={"access"}
              onClick={() => this.toggleDialog('isAccessOpen')}
              text={intl.formatMessage(messages.access)}
              icon="key"
            />
            <Menu.Item
              key={"reingest"}
              onClick={() => this.toggleDialog('isReingestOpen')}
              text={intl.formatMessage(messages.reingest)}
              icon="automatic-updates"
            />
            <Menu.Item
              key={"reindex"}
              onClick={() => this.toggleDialog('isReindexOpen')}
              text={intl.formatMessage(messages.reindex)}
              icon="search-template"
            />
            <Menu.Item
              key={"delete"}
              onClick={() => this.toggleDialog('isDeleteOpen')}
              text={intl.formatMessage(deleteMessage)}
              intent={Intent.DANGER}
              icon="trash"
            />
          </Menu>
        </Popover>
        <CollectionEditDialog
          isOpen={!!this.state.isEditOpen}
          toggleDialog={() => this.toggleDialog('isEditOpen')}
          collection={collection}
        />
        <CollectionAccessDialog
          isOpen={!!this.state.isAccessOpen}
          toggleDialog={() => this.toggleDialog('isAccessOpen')}
          collection={collection}
        />
        <CollectionReingestAlert
          isOpen={!!this.state.isReingestOpen}
          toggleDialog={() => this.toggleDialog('isReingestOpen')}
          collection={collection}
        />
        <CollectionReindexAlert
          isOpen={!!this.state.isReindexOpen}
          toggleDialog={() => this.toggleDialog('isReindexOpen')}
          collection={collection}
        />
        <CollectionDeleteDialog
          isOpen={!!this.state.isDeleteOpen}
          toggleDialog={() => this.toggleDialog('isDeleteOpen')}
          collection={collection}
        />
      </>
    );
  }
}

export default injectIntl(CollectionManageMenu);
