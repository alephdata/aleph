import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import { showErrorToast, showSuccessToast } from 'src/app/toast';
import { createCollectionMapping, deleteCollectionMapping, updateCollectionMapping } from 'src/actions';

import MappingPreviewDialog from 'src/dialogs/MappingPreviewDialog/MappingPreviewDialog';
import MappingCreateDialog from 'src/dialogs/MappingCreateDialog/MappingCreateDialog';
import MappingSaveDialog from 'src/dialogs/MappingSaveDialog/MappingSaveDialog';
import MappingDeleteDialog from 'src/dialogs/MappingDeleteDialog/MappingDeleteDialog';
import { selectSession } from 'src/selectors';


class MappingManageMenu extends Component {
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

  render() {
    const { mappingId, mappings } = this.props;
    const { createIsOpen, deleteIsOpen, previewIsOpen, saveIsOpen } = this.state;

    return (
      <>
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
        <MappingPreviewDialog
          isOpen={previewIsOpen}
          mappings={mappings}
          toggleDialog={this.togglePreview}
        />
        <MappingCreateDialog
          isOpen={createIsOpen}
          toggleDialog={this.toggleCreate}
          onCreate={this.onCreate}
        />
        <MappingSaveDialog
          isOpen={saveIsOpen}
          toggleDialog={this.toggleSave}
          onSave={this.onSave}
        />
        <MappingDeleteDialog
          isOpen={deleteIsOpen}
          toggleDialog={this.toggleDelete}
          onDelete={this.onDelete}
        />
      </>
    );
  }
}

const mapDispatchToProps = {
  createCollectionMapping,
  deleteCollectionMapping,
  updateCollectionMapping,
};

const mapStateToProps = state => ({ session: selectSession(state) });

MappingManageMenu = connect(mapStateToProps, mapDispatchToProps)(MappingManageMenu);
MappingManageMenu = injectIntl(MappingManageMenu);
export default MappingManageMenu;
