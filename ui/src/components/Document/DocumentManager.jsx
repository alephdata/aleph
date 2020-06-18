import _ from 'lodash';
import React, { Component } from 'react';
import { AnchorButton, Button, Callout, Divider, Tooltip } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import DocumentUploadDialog from 'src/dialogs/DocumentUploadDialog/DocumentUploadDialog';
import DocumentFolderButton from 'src/components/Toolbar/DocumentFolderButton';
import EntityActionBar from 'src/components/Entity/EntityActionBar';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';
import { ErrorSection } from 'src/components/common';
import getEntityLink from 'src/util/getEntityLink';
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
  search_placeholder: {
    id: 'entity.document.manager.search_placeholder',
    defaultMessage: 'Search documents',
  },
  cannot_map: {
    id: 'entity.document.manager.cannot_map',
    defaultMessage: 'Select a table document to generate structured entities from',
  },
});


export class DocumentManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      uploadIsOpen: false,
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleUpload = this.toggleUpload.bind(this);
    this.onUploadSuccess = this.onUploadSuccess.bind(this);
    this.openMappingEditor = this.openMappingEditor.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
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

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  onSearchSubmit(queryText) {
    const { query } = this.props;
    const newQuery = query.set('q', queryText);
    this.updateQuery(newQuery);
  }

  openMappingEditor() {
    const { history } = this.props;
    const { selection } = this.state;
    const pathname = getEntityLink(selection[0]);
    history.push({ pathname, hash: queryString.stringify({mode: 'mapping'}) });
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
    const canMap = selection.length === 1 && selection[0].schema.isA('Table');

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
        <EntityActionBar
          query={query}
          writeable={showActions}
          selection={selection}
          resetSelection={() => this.setState({ selection: []})}
          onSearchSubmit={this.onSearchSubmit}
          searchPlaceholder={intl.formatMessage(messages.search_placeholder)}
        >
          <>
            { canUpload && (
              <Button icon="upload" onClick={this.toggleUpload}>
                <FormattedMessage id="document.upload.button" defaultMessage="Upload" />
              </Button>
            )}
            <DocumentFolderButton collection={collection} parent={document} />
            <Divider />
            <Tooltip content={canMap ? null : intl.formatMessage(messages.cannot_map)}>
              <AnchorButton icon="new-object" disabled={!canMap} onClick={this.openMappingEditor}>
                <FormattedMessage id="document.mapping.start" defaultMessage="Generate entities" />
              </AnchorButton>
            </Tooltip>
          </>
        </EntityActionBar>
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
