import _ from 'lodash';
import React, { Component } from 'react';
import { Callout } from '@blueprintjs/core';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';

import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import { Toolbar } from 'src/components/Toolbar';
import DocumentDeleteDialog from 'src/dialogs/DocumentDeleteDialog/DocumentDeleteDialog';
import DocumentUploadButton from 'src/components/Toolbar/DocumentUploadButton';
import DocumentFolderButton from 'src/components/Toolbar/DocumentFolderButton';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';


class DocumentManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selection: [],
      deleteIsOpen: false
    };
    this.updateSelection = this.updateSelection.bind(this);
    this.toggleDeleteSelection = this.toggleDeleteSelection.bind(this);
  }

  componentDidMount() {
    this.interval = setInterval(() => this.refreshPending(), 2000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  refreshPending() {
    const { hasPending, query, result } = this.props;
    if (!result.isLoading && result.total !== undefined && hasPending) {
      const updateQuery = query.limit(result.results.length);
      this.props.queryEntities({ query: updateQuery });
    }
  }

  updateSelection(document) {
    const { selection } = this.state;
    this.setState({
      selection: _.xorBy(selection, [document], 'id')
    })
  }

  toggleDeleteSelection() {
    if (this.state.deleteIsOpen) {
      this.setState({selection: []});  
    }
    this.setState({deleteIsOpen: !this.state.deleteIsOpen});
  }

  render() {
    const { collection, document, query, hasPending, editable } = this.props;
    const { selection } = this.state;
    const updateSelection = editable ? this.updateSelection : undefined;
    
    return (
      <div className="DocumentManager">
        { editable && (
          <Toolbar>
            <div className="pt-button-group">
              <DocumentUploadButton collection={collection} parent={document} />
              <DocumentFolderButton collection={collection} parent={document} />
              <button type="button"
                      className="pt-button pt-icon-delete"
                      disabled={!selection.length}
                      onClick={this.toggleDeleteSelection}>
                <FormattedMessage id="document.viewer.delete" defaultMessage="Delete selected" />
              </button>
            </div>
          </Toolbar>
        )}
        { hasPending && (
          <Callout className="pt-icon-info-sign pt-intent-warning">
            <FormattedMessage id="refresh.callout_message"
                              defaultMessage="Documents are being processed. Please wait..." />
          </Callout>
        )}
        <EntitySearch query={query}
                      hideCollection={true}
                      documentMode={true}
                      selection={selection}
                      updateSelection={updateSelection} />
        <DocumentDeleteDialog documents={selection}
                              isOpen={this.state.deleteIsOpen}
                              toggleDialog={this.toggleDeleteSelection} />
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  let { collection, query } = ownProps;
  if (!query.hasSort()) {
    query = query.sortBy('name', 'asc');
  }

  const editable = collection.casefile && collection.writeable;
  if (editable) {
    query = query.set('cache', 'false');
  }

  const result = selectEntitiesResult(state, query);
  const status = _.map(result.results || [], 'status');
  const hasPending = status.indexOf('pending') !== -1;

  return { query, result, hasPending, editable };
};

DocumentManager = connect(mapStateToProps, {queryEntities})(DocumentManager);
DocumentManager = withRouter(DocumentManager);
export default DocumentManager;