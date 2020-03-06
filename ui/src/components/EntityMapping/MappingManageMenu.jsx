import React, { Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, ButtonGroup, Intent } from '@blueprintjs/core';
import { showErrorToast, showInfoToast } from 'src/app/toast';
import { createEntityMapping, flushEntityMapping, deleteEntityMapping, updateEntityMapping } from 'src/actions';

import MappingCreateDialog from 'src/dialogs/MappingCreateDialog/MappingCreateDialog';
import MappingFlushDialog from 'src/dialogs/MappingFlushDialog/MappingFlushDialog';
import MappingSaveDialog from 'src/dialogs/MappingSaveDialog/MappingSaveDialog';
import MappingDeleteDialog from 'src/dialogs/MappingDeleteDialog/MappingDeleteDialog';
import { selectSession } from 'src/selectors';

const messages = defineMessages({
  create: {
    id: 'mapping.actions.create.toast',
    defaultMessage: 'Generating entities...',
  },
  save: {
    id: 'mapping.actions.save.toast',
    defaultMessage: 'Re-generating entities...',
  },
  delete: {
    id: 'mapping.actions.delete.toast',
    defaultMessage: 'Deleting mapping and generated entities...',
  },
  flush: {
    id: 'mapping.actions.flush.toast',
    defaultMessage: 'Removing generated entities...',
  },
});


class MappingManageMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      createIsOpen: false,
      flushIsOpen: false,
      saveIsOpen: false,
      deleteIsOpen: false,
    };

    this.toggleCreate = this.toggleCreate.bind(this);
    this.toggleSave = this.toggleSave.bind(this);
    this.toggleFlush = this.toggleFlush.bind(this);
    this.toggleDelete = this.toggleDelete.bind(this);
    this.onCreate = this.onCreate.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onFlush = this.onFlush.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  onSave() {
    const { entity, mappings, mappingId, validate, intl } = this.props;
    if (validate()) {
      try {
        this.props.updateEntityMapping(entity, mappingId, mappings);
        showInfoToast(intl.formatMessage(messages.save));
        this.toggleSave();
      } catch (e) {
        showErrorToast(e);
      }
    }
  }

  onCreate() {
    const { entity, mappings, validate, intl } = this.props;
    if (validate()) {
      try {
        this.props.createEntityMapping(entity, mappings);
        showInfoToast(intl.formatMessage(messages.create));
        this.toggleCreate();
      } catch (e) {
        showErrorToast(e);
      }
    }
  }

  onDelete() {
    const { entity, mappingId, intl } = this.props;

    try {
      this.props.deleteEntityMapping(entity, mappingId);
      showInfoToast(intl.formatMessage(messages.delete));
      this.toggleDelete();
    } catch (e) {
      showErrorToast(e);
    }
  }

  onFlush() {
    const { entity, mappingId, intl } = this.props;

    try {
      this.props.flushEntityMapping(entity, mappingId);
      showInfoToast(intl.formatMessage(messages.flush));
      this.toggleFlush();
    } catch (e) {
      showErrorToast(e);
    }
  }

  toggleCreate = () => this.setState(({ createIsOpen }) => (
    { createIsOpen: !createIsOpen }
  ));

  toggleSave = () => this.setState(({ saveIsOpen }) => (
    { saveIsOpen: !saveIsOpen }
  ));

  toggleFlush = () => this.setState(({ flushIsOpen }) => (
    { flushIsOpen: !flushIsOpen }
  ));

  toggleDelete = () => this.setState(({ deleteIsOpen }) => ({ deleteIsOpen: !deleteIsOpen }));

  render() {
    const { mappingId } = this.props;
    const { createIsOpen, deleteIsOpen, flushIsOpen, saveIsOpen } = this.state;

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
              <FormattedMessage id="mapping.actions.create" defaultMessage="Generate entities" />
            </Button>
          )}

          {mappingId && (
            <Button icon="delete" onClick={this.toggleFlush}>
              <FormattedMessage id="mapping.actions.flush" defaultMessage="Remove generated entities" />
            </Button>
          )}
          <Button icon="trash" onClick={this.toggleDelete}>
            <FormattedMessage id="mapping.actions.delete" defaultMessage="Delete" />
          </Button>
        </ButtonGroup>
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
        <MappingFlushDialog
          isOpen={flushIsOpen}
          toggleDialog={this.toggleFlush}
          onFlush={this.onFlush}
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
  createEntityMapping,
  flushEntityMapping,
  deleteEntityMapping,
  updateEntityMapping,
};

const mapStateToProps = state => ({ session: selectSession(state) });

MappingManageMenu = connect(mapStateToProps, mapDispatchToProps)(MappingManageMenu);
MappingManageMenu = injectIntl(MappingManageMenu);
export default MappingManageMenu;
