import React from 'react';
import queryString from 'query-string';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';

const messages = defineMessages({
  search_paceholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search…',
  }
});

class CollectionSearch extends React.Component {
    constructor(props) {
      super(props);
      this.state = {queryText: ''};
      this.onSearchQueryChange = this.onSearchQueryChange.bind(this);
      this.onSubmitSearch = this.onSubmitSearch.bind(this);
    }

    onSearchQueryChange(e) {
      const queryText = (e.target.value && e.target.value.length > 0) ? e.target.value : null;
      this.setState({ queryText });
    }

    onSubmitSearch(event) {
      const { history, collection } = this.props;
      const { queryText } = this.state;
      event.preventDefault();
      const query = {
        'q': queryText,
        'filter:collection_id': collection.id
      };
      history.push({
          pathname: '/search',
          search: queryString.stringify(query)
      });
    }

    render() {
      const { intl } = this.props;
      const { queryText } = this.state;

      return (
        <form onSubmit={this.onSubmitSearch} className="CollectionSearch search-box">
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-search"/>
            <input className="pt-input" type="search" dir="auto"
                   placeholder={intl.formatMessage(messages.search_paceholder)}
                   onChange={this.onSearchQueryChange}
                   value={queryText || ''} />
          </div>
        </form>
      );
    }
}

CollectionSearch = withRouter(CollectionSearch);
CollectionSearch = injectIntl(CollectionSearch);
export default CollectionSearch;