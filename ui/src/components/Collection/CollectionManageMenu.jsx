import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent, Tooltip } from '@blueprintjs/core';

import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionPublishAlert from 'src/components/Collection/CollectionPublishAlert';
import CollectionDeleteDialog from 'src/dialogs/CollectionDeleteDialog/CollectionDeleteDialog';
import { selectSession } from 'src/selectors';

const messages = defineMessages({
  publish: {
    id: 'collection.publish.admin',
    defaultMessage: 'Only administrators can publish a dataset.',
  },
});


class CollectionManageMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settingsIsOpen: false,
      accessIsOpen: false,
      deleteIsOpen: false,
      publishIsOpen: false,
    };
    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
  }

  toggleDelete = () => this.setState(({ deleteIsOpen }) => ({ deleteIsOpen: !deleteIsOpen }));

  togglePublish = () => this.setState(({ publishIsOpen }) => ({ publishIsOpen: !publishIsOpen }));

  toggleAccess() {
    this.setState(({ accessIsOpen }) => ({ accessIsOpen: !accessIsOpen }));
  }

  toggleSettings() {
    this.setState(({ settingsIsOpen }) => ({ settingsIsOpen: !settingsIsOpen }));
  }

  render() {
    const { intl, collection, session } = this.props;
    const {
      settingsIsOpen, accessIsOpen, deleteIsOpen, publishIsOpen,
    } = this.state;

    if (!collection.writeable) {
      return null;
    }
    let publishButton = (
      <Button icon="document-share" onClick={this.togglePublish} disabled={!session.isAdmin}>
        <FormattedMessage id="collection.info.publish" defaultMessage="Publish" />
      </Button>
    );
    if (!collection.isAdmin) {
      publishButton = (
        <Tooltip content={intl.formatMessage(messages.publish)}>
          {publishButton}
        </Tooltip>
      );
    }

    return (
      <React.Fragment>
        <ButtonGroup>
          <Button icon="cog" onClick={this.toggleSettings}>
            <FormattedMessage id="collection.info.settings" defaultMessage="Settings" />
          </Button>
          <Button icon="key" onClick={this.toggleAccess}>
            <FormattedMessage id="collection.info.access" defaultMessage="Share" />
          </Button>
          { collection.casefile && publishButton }
          <Button icon="trash" onClick={this.toggleDelete} intent={Intent.DANGER}>
            <FormattedMessage id="collection.info.delete" defaultMessage="Delete" />
          </Button>
        </ButtonGroup>
        <CollectionEditDialog
          collection={collection}
          isOpen={settingsIsOpen}
          toggleDialog={this.toggleSettings}
        />
        <CollectionAccessDialog
          collection={collection}
          isOpen={accessIsOpen}
          toggleDialog={this.toggleAccess}
        />
        <CollectionPublishAlert
          collection={collection}
          isOpen={publishIsOpen}
          togglePublish={this.togglePublish}
        />
        <CollectionDeleteDialog
          isOpen={deleteIsOpen}
          collection={collection}
          toggleDialog={this.toggleDelete}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({ session: selectSession(state) });

CollectionManageMenu = connect(mapStateToProps)(CollectionManageMenu);
CollectionManageMenu = injectIntl(CollectionManageMenu);
export default CollectionManageMenu;
