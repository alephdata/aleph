import React, { Component } from 'react';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';
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

    return (
      <React.Fragment>
        <DocumentToolbar document={document}
                         queryText={this.props.query.getString('prefix')}
                         queryPlaceholder={queryPlaceholder}
                         onChangeQuery={this.onQueryPrefixChange} />
        <div id="children" className="FolderViewer">
          <EntitySearch query={query}
                        updateQuery={this.updateQuery}
                        hideCollection={true}
                        documentMode={true} />
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
  const prefix = Query.fromLocation('search', location, {}, 'folder').getString('prefix'),
        field = prefix.length === 0 ? 'filter:parent.id' : 'filter:ancestors',
        context = {[field]: document.id};
  const query = Query.fromLocation('search', location, context, 'folder').limit(50);
  return {
    query: query
  }
}

FolderViewer = connect(mapStateToProps)(FolderViewer);
FolderViewer = withRouter(FolderViewer);
FolderViewer = injectIntl(FolderViewer);
export default FolderViewer;
