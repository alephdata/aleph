import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';
import { debounce } from 'lodash';

import Query from 'src/app/Query';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';

import './FolderViewer.css';

const messages = defineMessages({
  placeholder: {
    id: 'document.placeholder_tolder_filter',
    defaultMessage: 'Search folder…',
  },
});

class FolderViewer extends Component {
  constructor(props) {
    super(props);
    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.replace({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash
    });
  } 
  
  componentWillReceiveProps(newProps) {
    if (newProps.queryText !== this.props.queryText) {
      this.updateQuery(this.props.query.set('prefix', newProps.queryText));
    }
  }

  render() {
    const { document, query } = this.props;
    
    if (!document || !document.id || !document.links) {
      return null;
    }

    return (
      <React.Fragment>
        <div id="children" className="FolderViewer">
          <EntitySearch query={query}
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
  // when a prefix is defined, we switch to recursive folder search - otherwise
  // a flat listing of the immediate children of this directory is shown.
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