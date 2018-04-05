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
    this.state = { 
      queryText: props.queryText || null
    };
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
    const queryText = (e.target.value && e.target.value.length > 0) ? e.target.value : null;
    this.setState({ 
      queryText: queryText
    });
    if (this.props.onSearchQueryChange) {
      this.props.onSearchQueryChange(queryText);
    }
    this.updateSearchQuery(this.props.query.set('prefix', queryText));
  }
  
  componentDidMount() {
    const queryText = this.props.queryText;
    
    if (this.props.onSearchQueryChange) {
      this.props.onSearchQueryChange(queryText);
    }
  }
  
  componentWillReceiveProps(newProps) {
    this.setState({ queryText: newProps.queryText});
  }
  
  onSubmitSearch(event) {
    const queryText = this.state.queryText;
    
    event.preventDefault();
    if (this.props.onSubmitSearch !== undefined) {
      this.props.onSubmitSearch(queryText);
    }
  }
  
  render() {
    const { document: doc, intl, disabled, placeholder } = this.props;
    const { queryText } = this.state;
    
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
      isSearchable = true;
    } else if (doc.schema === 'Image') {
      isSearchable = false;
    } else if (doc.schema === 'Folder') {
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
                  value={queryText} />
         </div>
       </form>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document: doc, location: loc } = ownProps;

  let searchType = (doc.schema === 'Folder') ? 'folder' : 'document';

  const prefix = Query.fromLocation('search', loc, {}, 'folder').getString('prefix'),
        field = prefix.length === 0 ? 'filter:parent.id' : 'filter:ancestors',
        context = {[field]: doc.id};

  const query = Query.fromLocation('search', loc, context, searchType).limit(50);
  return {
    query: query
  }
}

DocumentSearch = connect(mapStateToProps)(DocumentSearch);
DocumentSearch = withRouter(DocumentSearch);
DocumentSearch = injectIntl(DocumentSearch);

export default DocumentSearch;
