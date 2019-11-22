import _ from 'lodash';
import React, { Component } from 'react';
import { Callout, Button } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import Dropzone from 'react-dropzone';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import EntityDeleteDialog from 'src/dialogs/EntityDeleteDialog/EntityDeleteDialog';
import DocumentUploadDialog from 'src/dialogs/DocumentUploadDialog/DocumentUploadDialog';
import DocumentFolderButton from 'src/components/Toolbar/DocumentFolderButton';
import CollectionAnalyzeAlert from 'src/components/Collection/CollectionAnalyzeAlert';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';
import { ErrorSection } from 'src/components/common';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';

const messages = defineMessages({
  empty: {
    id: 'entity.document.manager.empty',
    defaultMessage: 'No files or directories.',
  },
});


export class DocumentManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      deleteIsOpen: false,
      analyzeIsOpen: false,
      uploadIsOpen: false,
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
    this.toggleUpload = this.toggleUpload.bind(this);
    this.toggleAnalyze = this.toggleAnalyze.bind(this);
  }

  componentDidMount() {
    this.refreshPending();
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  scheduleNextRefresh() {
    this.timeout = setTimeout(() => this.refreshPending(), 2000);
  }

  refreshPending() {
    const { hasPending, query, result } = this.props;
    if (!result.isLoading && result.total !== undefined && hasPending) {
      const updateQuery = query.limit(result.results.length);
      this.props.queryEntities({ query: updateQuery }).finally(() => this.scheduleNextRefresh());
    } else {
      this.scheduleNextRefresh();
    }
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
    this.setState(({ uploadIsOpen }) => ({ uploadIsOpen: !uploadIsOpen }));
  }

  toggleAnalyze() {
    this.setState(({ analyzeIsOpen }) => ({ analyzeIsOpen: !analyzeIsOpen }));
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
    const updateSelection = showActions ? this.updateSelection : undefined;
    const canUpload = this.canUpload();

    const emptyComponent = (
      <ErrorSection
        icon="folder-open"
        title={intl.formatMessage(messages.empty)}
      />
    );

    const contents = (
      <EntitySearch
        query={query}
        hideCollection
        documentMode
        showPreview={false}
        selection={selection}
        updateSelection={updateSelection}
        emptyComponent={emptyComponent}
      />
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
            <Button icon="delete" onClick={this.toggleDeleteSelection} disabled={!selection.length}>
              <FormattedMessage id="document.viewer.delete" defaultMessage="Delete" />
            </Button>
            { mutableCollection && !document && (
              <Button icon="automatic-updates" onClick={this.toggleAnalyze}>
                <FormattedMessage id="document.manager.analyze" defaultMessage="Re-process" />
              </Button>
            )}
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
        { canUpload && (
          <Dropzone onDrop={acceptedFiles => console.log(acceptedFiles)}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                {contents}
              </div>
            )}
          </Dropzone>
        )}
        { !canUpload && contents }
        <EntityDeleteDialog
          entities={selection}
          isOpen={this.state.deleteIsOpen}
          toggleDialog={this.toggleDeleteSelection}
        />
        <DocumentUploadDialog
          collection={collection}
          parent={document}
          isOpen={this.state.uploadIsOpen}
          toggleDialog={this.toggleUpload}
        />
        <CollectionAnalyzeAlert
          collection={collection}
          isOpen={this.state.analyzeIsOpen}
          toggleAlert={this.toggleAnalyze}
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

  const result = selectEntitiesResult(state, query);
  const status = _.map(result.results || [], 'status');
  const hasPending = status.indexOf('pending') !== -1;
  return {
    query, result, hasPending,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
  injectIntl,
)(DocumentManager);
