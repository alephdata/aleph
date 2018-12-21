import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';

import Query from 'src/app/Query';
import DocumentManager from 'src/components/Document/DocumentManager';

import './FolderViewer.scss';

class FolderViewer extends Component {
  render() {
    const { document, query, className } = this.props;
    return (
      <div className={`FolderViewer ${className}`}>
        {document.status === 'fail' && (
          <div className='warning-folder'>
            <strong>
              <FormattedMessage id="search.warning" defaultMessage="Warning:" />
            </strong>
            &nbsp;
            <p>
              <FormattedMessage id="search.not_properly_imported"
                                defaultMessage="This folder is not fully imported." />
            </p>
          </div>
        )}
        <DocumentManager query={query}
                         collection={document.collection}
                         document={document} />
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { document, location, queryText } = ownProps;
  // when a query is defined, we switch to recursive folder search - otherwise
  // a flat listing of the immediate children of this directory is shown.
  const q = Query.fromLocation('entities', location, {}, 'document').getString('q'),
        hasSearch = (q.length !== 0 || queryText),
        context = {};
    
  if (hasSearch) {
    context['filter:ancestors'] = document.id;
  } else {
    context['filter:parent.id'] = document.id;
  }

  let query = Query.fromLocation('entities', location, context, 'document').limit(50);
  if (queryText) {
    query = query.setString('q', queryText);
  }
  return { query };
};

FolderViewer = connect(mapStateToProps)(FolderViewer);
FolderViewer = withRouter(FolderViewer);
export default FolderViewer;