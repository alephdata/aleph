import _ from 'lodash';
import React, { Component } from 'react';
import { Callout, Button } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import EntityDeleteDialog from 'src/dialogs/EntityDeleteDialog/EntityDeleteDialog';
import DocumentUploadDialog from 'src/dialogs/DocumentUploadDialog/DocumentUploadDialog';
import DocumentFolderButton from 'src/components/Toolbar/DocumentFolderButton';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';
import { Count, ErrorSection } from 'src/components/common';
import { queryEntities } from 'src/actions';

import './DocumentManager.scss';

const messages = defineMessages({
  empty: {
    id: 'entity.document.manager.empty',
    defaultMessage: 'No files or directories.',
  },
  emptyCanUpload: {
    id: 'entity.document.manager.emptyCanUpload',
    defaultMessage: 'No files or directories. Drop files here or click to upload.',
  },
});


export class DocumentManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      deleteIsOpen: false,
      uploadIsOpen: false,
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
    this.toggleUpload = this.toggleUpload.bind(this);
    this.onUploadSuccess = this.onUploadSuccess.bind(this);
  }

  onUploadSuccess() {
    this.setState({ uploadIsOpen: false });
  }

  updateSelection(document) {
    const { selection } = this.state;
    this.setState({
      selection: _.xorBy(selection, [document], 'id'),
    });
  }

  toggleDeleteSelection() {
    const { deleteIsOpen } = this.state;
    if (deleteIsOpen) {
      this.setState({ selection: [] });
    }
    this.setState(({ deleteIsOpen: !deleteIsOpen }));
  }

  toggleUpload() {
    this.setState(({ uploadIsOpen }) => ({
      uploadIsOpen: !uploadIsOpen,
    }));
  }

  canUpload() {
    const { collection, document } = this.props;
    const parentFolder = document == null ? true : document.schema.isA('Folder');

    if (!parentFolder || !collection.writeable) {
      return false;
    }
    return true;
  }

  render() {
    const {
      collection, document, query, hasPending, intl,
    } = this.props;
    const { selection } = this.state;
    const mutableCollection = collection !== undefined && collection.writeable;
    const mutableDocument = document === undefined || (document.schema && document.schema.name === 'Folder');
    const showActions = mutableCollection && mutableDocument;
    const canUpload = this.canUpload();

    const emptyComponent = (
      // eslint-disable-next-line
      <div className="DocumentManager__content__empty" onClick={this.toggleUpload}>
        <ErrorSection
          icon={canUpload ? 'plus' : 'folder-open'}
          title={intl.formatMessage(canUpload ? messages.emptyCanUpload : messages.empty)}
        />
      </div>
    );

    return (
      <div className="DocumentManager">
        { showActions && (
          <div className="bp3-button-group">
            { canUpload && (
              <Button icon="upload" onClick={this.toggleUpload}>
                <FormattedMessage id="document.upload.button" defaultMessage="Upload" />
              </Button>
            )}
            <DocumentFolderButton collection={collection} parent={document} />
            <Button icon="trash" onClick={this.toggleDeleteSelection} disabled={!selection.length}>
              <span className="align-middle">
                <FormattedMessage id="document.viewer.delete" defaultMessage="Delete" />
              </span>
              <Count count={selection.length} />
            </Button>
          </div>
        )}
        { hasPending && (
          <Callout className="bp3-icon-info-sign bp3-intent-warning">
            <FormattedMessage
              id="refresh.callout_message"
              defaultMessage="Documents are being processed. Please wait..."
            />
          </Callout>
        )}
        <div className="DocumentManager__content">
          <EntitySearch
            query={query}
            hideCollection
            documentMode
            showPreview={false}
            selection={selection}
            writeable={showActions}
            updateSelection={this.updateSelection}
            emptyComponent={emptyComponent}
          />
        </div>
        <EntityDeleteDialog
          entities={selection}
          isOpen={this.state.deleteIsOpen}
          toggleDialog={this.toggleDeleteSelection}
        />
        <DocumentUploadDialog
          collection={collection}
          isOpen={this.state.uploadIsOpen}
          toggleDialog={this.toggleUpload}
          onUploadSuccess={this.onUploadSuccess}
          parent={document}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  let { query } = ownProps;
  const { collection } = ownProps;
  if (!query.hasSort()) {
    query = query.sortBy('name', 'asc');
  }
  if (collection.writeable) {
    query = query.set('cache', 'false');
  }
  return { query };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
  injectIntl,
)(DocumentManager);
