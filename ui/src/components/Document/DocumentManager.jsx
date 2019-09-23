import _ from 'lodash';
import React, { Component } from 'react';
import { Callout } from '@blueprintjs/core';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import EntityDeleteDialog from 'src/dialogs/EntityDeleteDialog/EntityDeleteDialog';
import DocumentUploadButton from 'src/components/Toolbar/DocumentUploadButton';
import DocumentFolderButton from 'src/components/Toolbar/DocumentFolderButton';
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
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
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

  render() {
    const {
      collection, document, query, hasPending, intl,
    } = this.props;
    const { selection } = this.state;
    const mutableCollection = collection !== undefined && collection.writeable;
    const mutableDocument = document === undefined || (document.schema && document.schema.name === 'Folder');
    const showActions = mutableCollection && mutableDocument;
    const updateSelection = showActions ? this.updateSelection : undefined;

    const emptyComponent = (
      <ErrorSection
        icon="folder-open"
        title={intl.formatMessage(messages.empty)}
      />
    );

    return (
      <div className="DocumentManager">
        { showActions && (
          <div className="bp3-button-group">
            <DocumentUploadButton collection={collection} parent={document} />
            <DocumentFolderButton collection={collection} parent={document} />
            <button
              type="button"
              className="bp3-button bp3-icon-delete"
              disabled={!selection.length}
              onClick={this.toggleDeleteSelection}
            >
              <FormattedMessage id="document.viewer.delete" defaultMessage="Delete" />
            </button>
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
        <EntitySearch
          query={query}
          hideCollection
          documentMode
          showPreview={false}
          selection={selection}
          updateSelection={updateSelection}
          emptyComponent={emptyComponent}
        />
        <EntityDeleteDialog
          entities={selection}
          isOpen={this.state.deleteIsOpen}
          toggleDialog={this.toggleDeleteSelection}
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
