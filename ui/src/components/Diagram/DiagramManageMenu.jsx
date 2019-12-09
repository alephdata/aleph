import React, { Component } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup } from '@blueprintjs/core';

import DiagramEditDialog from 'src/dialogs/DiagramEditDialog/DiagramEditDialog';
import DiagramDeleteDialog from 'src/dialogs/DiagramDeleteDialog/DiagramDeleteDialog';


class CollectionManageMenu extends Component {
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
    const { diagram } = this.props;
    const {
      editIsOpen, deleteIsOpen,
    } = this.state;

    if (!diagram.writeable) {
      return null;
    }

    return (
      <>
        <ButtonGroup>
          <Button icon="cog" onClick={this.toggleEdit}>
            <FormattedMessage id="diagram.info.edit" defaultMessage="Settings" />
          </Button>
          <Button icon="trash" onClick={this.toggleDelete}>
            <FormattedMessage id="diagram.info.delete" defaultMessage="Delete" />
          </Button>
        </ButtonGroup>
        <DiagramEditDialog
          diagram={diagram}
          isOpen={editIsOpen}
          toggleDialog={this.toggleEdit}
        />
        <DiagramDeleteDialog
          isOpen={deleteIsOpen}
          diagram={diagram}
          toggleDialog={this.toggleDelete}
        />
      </>
    );
  }
}

CollectionManageMenu = injectIntl(CollectionManageMenu);
export default CollectionManageMenu;
