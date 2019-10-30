import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import { showErrorToast, showSuccessToast } from 'src/app/toast';
import { createCollectionMapping, deleteCollectionMapping, updateCollectionMapping } from 'src/actions';

import EntityImportPreviewDialog from 'src/dialogs/EntityImportPreviewDialog/EntityImportPreviewDialog';
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
      previewIsOpen: false,
      createIsOpen: false,
      saveIsOpen: false,
      deleteIsOpen: false,
    };

    this.togglePreview = this.togglePreview.bind(this);
    this.toggleCreate = this.toggleCreate.bind(this);
    this.toggleSave = this.toggleSave.bind(this);
    this.toggleDelete = this.toggleDelete.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  async onSave() {
    const { collectionId, mappings, mappingId, validate } = this.props;
    if (validate()) {
      try {
        await this.props.updateCollectionMapping(collectionId, mappingId, mappings);
        this.toggleSave();
      } catch (e) {
        showErrorToast(e);
      }
    }
  }

  async onCreate() {
    const { collectionId, mappings, validate } = this.props;
    if (validate()) {
      try {
        await this.props.createCollectionMapping(collectionId, mappings);
        showSuccessToast('Successfully created');
      } catch (e) {
        showErrorToast(e);
      }
    }
  }

  async onDelete() {
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

  togglePreview = () => this.setState(({ previewIsOpen }) => (
    { previewIsOpen: !previewIsOpen }
  ));

  toggleCreate = () => this.setState(({ createIsOpen }) => (
    { createIsOpen: !createIsOpen }
  ));

  toggleSave = () => this.setState(({ saveIsOpen }) => (
    { saveIsOpen: !saveIsOpen }
  ));

  toggleDelete = () => this.setState(({ deleteIsOpen }) => ({ deleteIsOpen: !deleteIsOpen }));

  validate() {
    const { mappings } = this.props;

    console.log('validating', mappings);
  }

  render() {
    const { mappingId, mappings } = this.props;
    const { createIsOpen, deleteIsOpen, previewIsOpen, saveIsOpen } = this.state;

    return (
      <React.Fragment>
        <ButtonGroup>
          {mappingId && (
            <Button icon="floppy-disk" intent={Intent.PRIMARY} onClick={this.toggleSave}>
              <FormattedMessage id="mapping.actions.save" defaultMessage="Save changes" />
            </Button>
          )}
          {!mappingId && (
            <Button icon="add" intent={Intent.PRIMARY} onClick={this.toggleCreate}>
              <FormattedMessage id="mapping.actions.create" defaultMessage="Create mapping" />
            </Button>
          )}
          <Button icon="eye-open" onClick={this.togglePreview}>
            <FormattedMessage id="mapping.actions.preview" defaultMessage="Preview" />
          </Button>
          <Button icon="trash" onClick={this.toggleDelete}>
            <FormattedMessage id="mapping.actions.delete" defaultMessage="Delete" />
          </Button>
        </ButtonGroup>
        <EntityImportPreviewDialog
          isOpen={previewIsOpen}
          mappings={mappings}
          toggleDialog={this.togglePreview}
        />
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
