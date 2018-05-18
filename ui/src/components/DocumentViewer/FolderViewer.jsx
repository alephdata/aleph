import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';

import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';

import './FolderViewer.css';

class FolderViewer extends Component {
  render() {
    const { document, query, className } = this.props;

    return (
      <React.Fragment>
        <div id="children" className={`FolderViewer ${className}`}>
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
          <EntitySearch query={query} hideCollection={true} documentMode={true} />
          {document.children === 0 && (
            <p className="folder-empty pt-text-muted">
              <FormattedMessage id="folder.empty"
                                defaultMessage="This folder is empty" />
            </p>
          )}
        </div>
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { document, location, queryText } = ownProps;
  // when a query is defined, we switch to recursive folder search - otherwise
  // a flat listing of the immediate children of this directory is shown.
  const q = Query.fromLocation('search', location, {}, 'document').getString('q'),
        hasSearch = (q.length !== 0 || queryText),
        context = {};
    
  if (hasSearch) {
    context['filter:ancestors'] = document.id;
  } else {
    context['filter:parent.id'] = document.id;
    context['sort'] = 'name:asc';
  }

  let query = Query.fromLocation('search', location, context, 'document').limit(50);
  if (queryText) {
    query = query.setString('q', queryText);
  }

  return { query }
};

FolderViewer = connect(mapStateToProps)(FolderViewer);
FolderViewer = withRouter(FolderViewer);
export default FolderViewer;