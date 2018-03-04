import React, { Component } from 'react';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import Query from 'src/app/Query';
import SearchContext from 'src/components/search/SearchContext';
import { DocumentToolbar } from 'src/components/Toolbar';

import './FolderViewer.css';


const messages = defineMessages({
  placeholder: {
    id: 'document.placeholder_tolder_filter',
    defaultMessage: 'Search this folder',
  },
});


class FolderViewer extends Component {
  constructor(props) {
    super(props);

    this.updateQuery = this.updateQuery.bind(this);
    this.onQueryPrefixChange = debounce(this.onQueryPrefixChange.bind(this), 200);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.replace({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  onQueryPrefixChange(prefix) {
    this.updateQuery(this.props.query.set('prefix', prefix));
  }

  render() {
    const { document, query, intl } = this.props;
    const queryPlaceholder = intl.formatMessage(messages.placeholder);

    if (!document || !document.id || !document.links) {
      return null;
    }
    
    const aspects = {
      filter: false,
      countries: false,
      collections: false
    };
    
    return (
      <React.Fragment>
        <DocumentToolbar document={document}
                         queryText={this.props.query.getString('prefix')}
                         queryPlaceholder={queryPlaceholder}
                         onChangeQuery={this.onQueryPrefixChange} />
        <div id="children" className="FolderViewer">
          <SearchContext query={query} updateQuery={this.updateQuery} aspects={aspects} />
          {document.children === 0 && (
            <p className="folder-empty pt-text-muted">
              <FormattedMessage
                id="folder.empty"
                defaultMessage="This folder is empty."/>
            </p>
          )}
        </div>
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { document, location } = ownProps;
  const context = {
    'filter:parent.id': document.id
  };
  // @TODO: we can make a conditional here to see if a prefix if 
  // defined, and if so switch from alphabetically-ranked shallow
  // listings to deep search sorted by relevancy.
  // the resulting behaviour is equivalent to OS X.
  const query = Query.fromLocation('search', location, context, 'folder').limit(50);
  return {
    query: query
  }
}

FolderViewer = connect(mapStateToProps)(FolderViewer);
FolderViewer = withRouter(FolderViewer);
FolderViewer = injectIntl(FolderViewer);
export default FolderViewer;
