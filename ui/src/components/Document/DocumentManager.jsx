import _ from 'lodash';
import React, { Component } from 'react';
import { AnchorButton, Callout, Divider, Tooltip } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { DialogToggleButton } from 'components/Toolbar';
import DocumentUploadDialog from 'dialogs/DocumentUploadDialog/DocumentUploadDialog';
import DocumentMoveDialog from 'dialogs/DocumentMoveDialog/DocumentMoveDialog';
import DocumentFolderDialog from 'dialogs/DocumentFolderDialog/DocumentFolderDialog';
import EntityActionBar from 'components/Entity/EntityActionBar';
import EntityDeleteButton from 'components/Toolbar/EntityDeleteButton';
import EntitySearch from 'components/EntitySearch/EntitySearch';
import { ErrorSection } from 'components/common';
import getEntityLink from 'util/getEntityLink';
import { selectEntitiesResult } from 'selectors';
import { deleteEntity, queryEntities } from 'actions';

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
    defaultMessage: 'Select a table document to generate structured entities',
  },
  move: {
    id: 'document.folder.move',
    defaultMessage: 'Move',
  },
  new: {
    id: 'document.folder.new',
    defaultMessage: 'New folder',
  },
  upload: {
    id: 'document.upload.button',
    defaultMessage: 'Upload',
  },
});


export class DocumentManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.openMappingEditor = this.openMappingEditor.bind(this);
    this.updateQuery = this.updateQuery.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
  }

  updateSelection(document) {
    const { selection } = this.state;
    this.setState({
      selection: _.xorBy(selection, [document], 'id'),
    });
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
    history.push({ pathname, hash: queryString.stringify({ mode: 'mapping' }) });
  }

  render() {
    const {
      collection, document, query, result, hasPending, intl,
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
          resetSelection={() => this.setState({ selection: [] })}
          onSearchSubmit={this.onSearchSubmit}
          searchPlaceholder={intl.formatMessage(messages.search_placeholder)}
          searchDisabled={result.total === 0 && !query.hasQuery()}
        >
          {canUpload && (
            <DialogToggleButton
              buttonProps={{
                text: intl.formatMessage(messages.upload),
                icon: "upload"
              }}
              Dialog={DocumentUploadDialog}
              dialogProps={{ collection, parent: document }}
            />
          )}
          <DialogToggleButton
            buttonProps={{
              text: intl.formatMessage(messages.new),
              icon: "folder-new"
            }}
            Dialog={DocumentFolderDialog}
            dialogProps={{ collection, parent: document }}
          />
          <Divider />
          <DialogToggleButton
            buttonProps={{
              text: intl.formatMessage(messages.move),
              icon: "folder-shared-open",
              disabled: !selection.length
            }}
            Dialog={DocumentMoveDialog}
            dialogProps={{ entities: selection }}
          />
          <Tooltip content={canMap ? null : intl.formatMessage(messages.cannot_map)} className="prevent-flex-grow">
            <AnchorButton icon="new-object" disabled={!canMap} onClick={this.openMappingEditor}>
              <FormattedMessage id="document.mapping.start" defaultMessage="Generate entities" />
            </AnchorButton>
          </Tooltip>
          <EntityDeleteButton
            entities={selection}
            onSuccess={() => this.setState({ selection: [] })}
            actionType="delete"
            deleteEntity={this.props.deleteEntity}
            showCount
          />
        </EntityActionBar>
        {hasPending && (
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
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  let { query } = ownProps;
  const { collection } = ownProps;
  if (!query.hasSort()) {
    query = query.sortBy('caption', 'asc');
  }
  if (collection.writeable) {
    query = query.set('cache', 'false');
  }
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities, deleteEntity }),
  injectIntl,
)(DocumentManager);
