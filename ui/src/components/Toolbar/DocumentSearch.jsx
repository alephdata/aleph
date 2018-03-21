import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import { debounce } from 'lodash';

import Query from 'src/app/Query';

const messages = defineMessages({
  search_paceholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search…',
  }
})

class DocumentSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = { queryText: props.queryText || '' };
    this.updateSearchQuery = debounce(this.updateSearchQuery.bind(this), 200);
    this.onSearchQueryChange = this.onSearchQueryChange.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
  }
  
  updateSearchQuery(newQuery) {
    const { history, location, query } = this.props;
    history.replace({
      pathname: location.pathname,
      search: query.toLocation(),
      hash: location.hash
    });
  }

  onSearchQueryChange(e) {
    const queryText = e.target.value;
    this.setState({ queryText: queryText });
    if (this.props.onSearchQueryChange) {
      this.props.onSearchQueryChange(queryText);
    }
    this.updateSearchQuery(this.props.query.set('prefix', queryText));
  }
  
  componentDidMount() {
    const queryText = this.props.query.getString('prefix');
    this.setState({ queryText: queryText });

    if (this.props.onSearchQueryChange) {
      this.props.onSearchQueryChange(queryText);
    }
  }
  
  componentWillReceiveProps(newProps) {
//    if (!this.props.queryText && newProps.queryText)
//      this.setState({ queryText: newProps.queryText });
  }
  
  onSubmitSearch(event) {
    event.preventDefault();
    if (this.props.onSubmitSearch !== undefined) {
      this.props.onSubmitSearch();
    }
  }
  
  render() {
    const { document: doc, intl, disabled, placeholder } = this.props;
    
    // This is a temporary conditional block to allow us to enable search
    // only on document types where we have added support for them in the UI.
    let isSearchable = false;
    if (doc.schema === 'Email') {
      isSearchable = false;
    } else if (doc.schema === 'Table' && doc.children !== undefined) {
      isSearchable = false;
    } else if (doc.text && !doc.html) {
      isSearchable = false;
    } else if (doc.html) {
      isSearchable = false;
    } else if (doc.links && doc.links.pdf) {
      isSearchable = false;
    } else if (doc.schema === 'Image') {
      isSearchable = false;
    } else if (doc.children !== undefined) {
      isSearchable = true;
    }
    if (isSearchable !== true)
      return null
      
    return (
      <form onSubmit={this.onSubmitSearch} className="DocumentSearch">
         <div className="pt-input-group">
           <span className="pt-icon pt-icon-search"></span>
           <input className="pt-input" type="search" dir="auto"
                  disabled={disabled}
                  placeholder={placeholder || intl.formatMessage(messages.search_paceholder)}
                  onChange={this.onSearchQueryChange}
                  value={this.state.queryText} />
         </div>
       </form>
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

DocumentSearch = connect(mapStateToProps)(DocumentSearch);
DocumentSearch = withRouter(DocumentSearch);
DocumentSearch = injectIntl(DocumentSearch);

export default DocumentSearch;
