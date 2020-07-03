import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';

import EntitySetEditDialog from 'src/dialogs/EntitySetEditDialog/EntitySetEditDialog';
import EntitySetDeleteDialog from 'src/dialogs/EntitySetDeleteDialog/EntitySetDeleteDialog';


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

  render() {
    const { entitySet, triggerDownload } = this.props;
    const {
      editIsOpen, deleteIsOpen,
    } = this.state;

    if (!entitySet.writeable) {
      return null;
    }

    return (
      <>
        <ButtonGroup>
          <Button icon="cog" onClick={this.toggleEdit}>
            <FormattedMessage id="entityset.info.edit" defaultMessage="Settings" />
          </Button>
          <Button icon="export" onClick={triggerDownload}>
            <FormattedMessage id="entityset.info.export" defaultMessage="Export" />
          </Button>
          <Button icon="trash" onClick={this.toggleDelete}>
            <FormattedMessage id="entityset.info.delete" defaultMessage="Delete" />
          </Button>
        </ButtonGroup>
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
