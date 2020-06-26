import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Popover, Menu, MenuItem } from '@blueprintjs/core';

import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionDeleteDialog from 'src/dialogs/CollectionDeleteDialog/CollectionDeleteDialog';
import { selectSession } from 'src/selectors';
import CollectionReingestAlert from './CollectionReingestAlert';
import CollectionReindexAlert from './CollectionReindexAlert';


class CollectionManageMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      editIsOpen: false,
      accessIsOpen: false,
      deleteIsOpen: false,
      reindexIsOpen: false,
      reingestIsOpen: false,
    };
    this.toggleEdit = this.toggleEdit.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
    this.toggleDelete = this.toggleDelete.bind(this);
    this.toggleReindex = this.toggleReindex.bind(this);
    this.toggleReingest = this.toggleReingest.bind(this);
  }

  toggleDelete = () => this.setState(({ deleteIsOpen }) => ({ deleteIsOpen: !deleteIsOpen }));

  toggleAccess = () => this.setState(({ accessIsOpen }) => ({ accessIsOpen: !accessIsOpen }));

  toggleEdit = () => this.setState(({ editIsOpen }) => ({ editIsOpen: !editIsOpen }));

  toggleReindex = () => this.setState(({ reindexIsOpen }) => ({ reindexIsOpen: !reindexIsOpen }));

  toggleReingest = () => this.setState(({ reingestIsOpen }) => ({ reingestIsOpen: !reingestIsOpen }));

  renderMenu() {
    const { collection, session } = this.props;

    return (
      <Menu>
        <MenuItem icon="automatic-updates" onClick={this.toggleReingest} text={
          <FormattedMessage id="collection.info.reingest" defaultMessage="Re-ingest documents" />
        } />
        <MenuItem icon="search-template" onClick={this.toggleReindex} text={
          <FormattedMessage id="collection.info.reindex" defaultMessage="Re-index all content" />
        } />
        <MenuItem icon="trash" onClick={this.toggleDelete} text={
          <FormattedMessage id="collection.info.delete" defaultMessage="Delete dataset" />
        } />
      </Menu>
    );
  }

  render() {
    const { collection } = this.props;
    if (!collection.writeable) {
      return null;
    }
    return (
      <>
        <ButtonGroup>
          <Button icon="cog" onClick={this.toggleEdit}>
            <FormattedMessage id="collection.info.edit" defaultMessage="Settings" />
          </Button>
          <Button icon="key" onClick={this.toggleAccess}>
            <FormattedMessage id="collection.info.access" defaultMessage="Share" />
          </Button>
          <Popover content={this.renderMenu()}>
            <Button rightIcon="caret-down" />
          </Popover>
        </ButtonGroup>
        <CollectionEditDialog
          collection={collection}
          isOpen={this.state.editIsOpen}
          toggleDialog={this.toggleEdit}
        />
        <CollectionAccessDialog
          collection={collection}
          isOpen={this.state.accessIsOpen}
          toggleDialog={this.toggleAccess}
        />
        <CollectionDeleteDialog
          isOpen={this.state.deleteIsOpen}
          collection={collection}
          toggleDialog={this.toggleDelete}
        />
        <CollectionReingestAlert
          isOpen={this.state.reingestIsOpen}
          collection={collection}
          toggleAlert={this.toggleReingest}
        />
        <CollectionReindexAlert
          isOpen={this.state.reindexIsOpen}
          collection={collection}
          toggleAlert={this.toggleReindex}
        />
      </>
    );
  }
}

const mapStateToProps = state => ({ session: selectSession(state) });

CollectionManageMenu = connect(mapStateToProps)(CollectionManageMenu);
CollectionManageMenu = injectIntl(CollectionManageMenu);
export default CollectionManageMenu;
