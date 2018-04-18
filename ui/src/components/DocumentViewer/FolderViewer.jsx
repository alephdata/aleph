import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';

import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';

import './FolderViewer.css';


class FolderViewer extends Component {
  render() {
    const { document, query, hasWarning } = this.props;
    
    if (!document || !document.id || !document.links) {
      return null;
    }

    return (
      <React.Fragment>
        <div id="children" className="FolderViewer">
          <EntitySearch query={query}
                        hideCollection={true}
                        documentMode={true}
                        hasWarning={hasWarning}/>
          {document.children === 0 && (
            <p className="folder-empty pt-text-muted">
              <FormattedMessage id="folder.empty"
                                defaultMessage="This folder is empty." />
            </p>
          )}
        </div>
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { document, location, queryText } = ownProps;
  // when a prefix is defined, we switch to recursive folder search - otherwise
  // a flat listing of the immediate children of this directory is shown.
  const prefix = Query.fromLocation('search', location, {}, 'document').getString('prefix'),
        hasSearch = (prefix.length !== 0 || queryText),
        context = {};
    
  if (hasSearch) {
    context['filter:ancestors'] = document.id;
  } else {
    context['filter:parent.id'] = document.id;
    context['sort'] = 'name:asc';
  }

  let query = Query.fromLocation('search', location, context, 'document').limit(50);
  if (queryText) {
    query = query.setString('prefix', queryText);
  }

  return {
    query: query
  }
}

FolderViewer = connect(mapStateToProps)(FolderViewer);
FolderViewer = withRouter(FolderViewer);
export default FolderViewer;