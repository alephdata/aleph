import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';

import Query from 'src/app/Query';
import { selectEntitiesResult } from 'src/selectors';
import { Toolbar } from 'src/components/Toolbar';
import { RefreshCallout } from 'src/components/common';
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

  updateSelection(document) {
    const { selection } = this.state;
    this.setState({
      selection: _.xorBy(selection, [document], 'id')
    })
  }

  toggleDeleteSelection() {
    this.setState({deleteIsOpen: !this.state.deleteIsOpen});
  }

  render() {
    const { collection, document, query, className } = this.props;
    const { selection } = this.state;
    const editable = collection.casefile && collection.writeable;
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
        <EntitySearch query={query}
                      hideCollection={true}
                      documentMode={true}
                      selection={selection}
                      updateSelection={updateSelection} />
        <DocumentDeleteDialog documents={selection}
                              isOpen={this.state.deleteIsOpen}
                              toggleDialog={this.toggleDeleteSelection}
                              path={'/collections/' + collection.id + '/documents'} />
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  let { query } = ownProps;
  if (!query.hasSort()) {
    query = query.sortBy('name', 'asc');
  }
  return { query, result: selectEntitiesResult(state, query) };
};

DocumentManager = connect(mapStateToProps)(DocumentManager);
DocumentManager = withRouter(DocumentManager);
export default DocumentManager;