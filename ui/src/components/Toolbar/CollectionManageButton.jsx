import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import {
  Button, Menu, MenuItem, MenuDivider, Position, Popover,
} from '@blueprintjs/core';

import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionAnalyzeAlert from 'src/components/Collection/CollectionAnalyzeAlert';
import CollectionPublishAlert from 'src/components/Collection/CollectionPublishAlert';
import CollectionDeleteDialog from 'src/dialogs/CollectionDeleteDialog/CollectionDeleteDialog';
import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import { selectSession } from 'src/selectors';


class CollectionManageButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settingsIsOpen: false,
      accessIsOpen: false,
      xrefIsOpen: false,
      analyzeIsOpen: false,
      deleteIsOpen: false,
      publishIsOpen: false,
    };

    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
    this.toggleXref = this.toggleXref.bind(this);
  }

  toggleDelete = () => this.setState(({ deleteIsOpen }) => ({ deleteIsOpen: !deleteIsOpen }));

  toggleAnalyze = () => this.setState(({ analyzeIsOpen }) => ({ analyzeIsOpen: !analyzeIsOpen }));

  togglePublish = () => this.setState(({ publishIsOpen }) => ({ publishIsOpen: !publishIsOpen }));

  toggleXref() {
    this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));
  }

  toggleAccess() {
    this.setState(({ accessIsOpen }) => ({ accessIsOpen: !accessIsOpen }));
  }

  toggleSettings() {
    this.setState(({ settingsIsOpen }) => ({ settingsIsOpen: !settingsIsOpen }));
  }

  render() {
    const { collection, session } = this.props;
    const {
      settingsIsOpen, accessIsOpen, xrefIsOpen, analyzeIsOpen, deleteIsOpen, publishIsOpen,
    } = this.state;

    if (!collection.writeable) {
      return null;
    }
    const canPublish = collection.casefile && session.isAdmin;

    return (
      <React.Fragment>
        <Popover
          content={(
            <Menu>
              <MenuItem
                icon="cog"
                onClick={this.toggleSettings}
                text={<FormattedMessage id="collection.info.edit_button" defaultMessage="Settings" />}
              />
              <MenuItem
                icon="key"
                onClick={this.toggleAccess}
                text={<FormattedMessage id="collection.info.share" defaultMessage="Share" />}
              />
              {canPublish && (
                <MenuItem
                  icon="social-media"
                  onClick={this.togglePublish}
                  text={<FormattedMessage id="collection.info.publish" defaultMessage="Publish dataset" />}
                />
              )}
              <MenuDivider />
              <MenuItem
                icon="search-around"
                onClick={this.toggleXref}
                text={<FormattedMessage id="collection.info.xref" defaultMessage="Cross-reference" />}
              />
              <MenuItem
                icon="automatic-updates"
                onClick={this.toggleAnalyze}
                text={<FormattedMessage id="collection.info.analyze" defaultMessage="Re-analyze" />}
              />
              <Menu.Divider />
              <MenuItem
                icon="trash"
                intent="danger"
                onClick={this.toggleDelete}
                text={<FormattedMessage id="collection.info.delete" defaultMessage="Delete" />}
              />
            </Menu>
        )}
          position={Position.BOTTOM_LEFT}
        >
          <Button
            icon="cog"
            className="bp3-intent-primary"
            text={
              <FormattedMessage id="collection.info.manage_button" defaultMessage="Manage..." />
            }
          />
        </Popover>
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
        <CollectionXrefDialog
          collection={collection}
          isOpen={xrefIsOpen}
          toggleDialog={this.toggleXref}
        />
        <CollectionAnalyzeAlert
          collection={collection}
          isOpen={analyzeIsOpen}
          toggleAlert={this.toggleAnalyze}
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

CollectionManageButton = connect(mapStateToProps)(CollectionManageButton);
export default CollectionManageButton;
