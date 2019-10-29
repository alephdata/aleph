import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';
import { showErrorToast, showSuccessToast } from 'src/app/toast';
import { createCollectionMapping, deleteCollectionMapping, updateCollectionMapping } from 'src/actions';

import EntityImportCreateDialog from 'src/dialogs/EntityImportCreateDialog/EntityImportCreateDialog';
import EntityImportSaveDialog from 'src/dialogs/EntityImportSaveDialog/EntityImportSaveDialog';
import EntityImportDeleteDialog from 'src/dialogs/EntityImportDeleteDialog/EntityImportDeleteDialog';
import { selectSession } from 'src/selectors';

// const messages = defineMessages({
//   publish: {
//     id: 'collection.publish.admin',
//     defaultMessage: 'Only administrators can publish a dataset.',
//   },
// });

class EntityImportManageMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      createIsOpen: false,
      saveIsOpen: false,
      deleteIsOpen: false,
    };

    this.toggleCreate = this.toggleCreate.bind(this);
    this.toggleSave = this.toggleSave.bind(this);
    this.toggleDelete = this.toggleDelete.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  async onSave() {
    const { collectionId, mappings, mappingId } = this.props;

    try {
      await this.props.updateCollectionMapping(collectionId, mappingId, mappings);
      this.toggleSave();
    } catch (e) {
      showErrorToast(e);
    }
  }

  async onCreate() {
    const { collectionId, mappings } = this.props;

    try {
      await this.props.createCollectionMapping(collectionId, mappings);
      showSuccessToast('Successfully created');
    } catch (e) {
      showErrorToast(e);
    }
  }

  async onDelete() {
    console.log('in on delete', this.props);
    const { collectionId, mappingId } = this.props;

    try {
      await this.props.deleteCollectionMapping(collectionId, mappingId);
      showSuccessToast('Successfully deleted');
      this.toggleDelete();
    } catch (e) {
      console.log(e);
      showErrorToast(e);
    }
  }

  toggleCreate = () => this.setState(({ createIsOpen }) => (
    { createIsOpen: !createIsOpen }
  ));

  toggleSave = () => this.setState(({ saveIsOpen }) => (
    { saveIsOpen: !saveIsOpen }
  ));

  toggleDelete = () => this.setState(({ deleteIsOpen }) => ({ deleteIsOpen: !deleteIsOpen }));


  render() {
    const { mappingId } = this.props;
    const { createIsOpen, deleteIsOpen, saveIsOpen } = this.state;

    return (
      <React.Fragment>
        {mappingId && (
          <Button icon="floppy-disk" onClick={this.toggleSave}>
            <FormattedMessage id="mapping.actions.save" defaultMessage="Save changes" />
          </Button>
        )}
        {!mappingId && (
          <Button icon="add" onClick={this.toggleCreate}>
            <FormattedMessage id="mapping.actions.create" defaultMessage="Create mapping" />
          </Button>
        )}
        <Button icon="trash" onClick={this.toggleDelete}>
          <FormattedMessage id="mapping.actions.delete" defaultMessage="Delete" />
        </Button>
        <EntityImportCreateDialog
          isOpen={createIsOpen}
          toggleDialog={this.toggleCreate}
          onCreate={this.onCreate}
        />
        <EntityImportSaveDialog
          isOpen={saveIsOpen}
          toggleDialog={this.toggleSave}
          onSave={this.onSave}
        />
        <EntityImportDeleteDialog
          isOpen={deleteIsOpen}
          toggleDialog={this.toggleDelete}
          onDelete={this.onDelete}
        />
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = {
  createCollectionMapping,
  deleteCollectionMapping,
  updateCollectionMapping,
};

const mapStateToProps = state => ({ session: selectSession(state) });

EntityImportManageMenu = connect(mapStateToProps, mapDispatchToProps)(EntityImportManageMenu);
EntityImportManageMenu = injectIntl(EntityImportManageMenu);
export default EntityImportManageMenu;
