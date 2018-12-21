import React from 'react';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';

import Query from 'src/app/Query';

const messages = defineMessages({
  search_paceholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search…',
  }
});

class DocumentSearch extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        queryText: props.query.getString('q')
      };
      this.onSearchQueryChange = this.onSearchQueryChange.bind(this);
      this.onSubmitSearch = this.onSubmitSearch.bind(this);
    }

    onSearchQueryChange(e) {
      const queryText = (e.target.value && e.target.value.length > 0) ? e.target.value : null;
      this.setState({ queryText });
    }

    onSubmitSearch(event) {
      const { history, location, query } = this.props;
      const { queryText } = this.state;
      event.preventDefault();
      const hashQuery = queryString.parse(location.hash);
      if (queryText && queryText.length > 0) {
        hashQuery['mode'] = 'search';
        hashQuery['page'] = undefined;
      } else {
        hashQuery['mode'] = 'view';
      }

      history.push({
          pathname: location.pathname,
          search: query.setString('q', queryText).toLocation(),
          hash: queryString.stringify(hashQuery)
      });
    }

    render() {
      const { document, intl, disabled, placeholder } = this.props;
      const { queryText } = this.state;

      // This is a temporary conditional block to allow us to enable search
      // only on document types where we have added support for them in the UI.
      const SEARCHABLE = ['Pages', 'Table', 'Folder', 'Package', 'Workbook'];
      if (SEARCHABLE.indexOf(document.schema) === -1) {
        return null;
      }

      return (
        <form onSubmit={this.onSubmitSearch} className="DocumentSearch search-box">
          <div className="bp3-input-group">
            <span className="bp3-icon bp3-icon-search"/>
            <input className="bp3-input" type="search" dir="auto"
                    disabled={disabled}
                    placeholder={placeholder || intl.formatMessage(messages.search_paceholder)}
                    onChange={this.onSearchQueryChange}
                    value={queryText || ''} />
          </div>
        </form>
      );
    }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('entities', location, {}, 'document').limit(50);
  return { query };
};

DocumentSearch = connect(mapStateToProps)(DocumentSearch);
DocumentSearch = withRouter(DocumentSearch);
DocumentSearch = injectIntl(DocumentSearch);
export default DocumentSearch;