import React, { PureComponent } from 'react';
import c from 'classnames';
import { defineMessages, injectIntl } from 'react-intl';

const messages = defineMessages({
  search_placeholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search…',
  },
});

export class SearchBox extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.searchText !== prevState.searchText) {
      return {
        searchText: nextProps.searchText,
        queryText: nextProps.searchText,
      };
    }
    return {};
  }

  onSearchChange(e) {
    const queryText = (e.target.value && e.target.value.length > 0) ? e.target.value : null;
    this.setState({ queryText });
  }

  onSubmitSearch(event) {
    const { onSearch } = this.props;
    const { queryText } = this.state;
    event.preventDefault();
    if (onSearch) {
      onSearch(queryText);
    }
  }

  render() {
    const { intl, searchPlaceholder, className } = this.props;
    const { queryText } = this.state;
    const placeholder = searchPlaceholder || intl.formatMessage(messages.search_placeholder);
    if (!this.props.onSearch) {
      return null;
    }
    return (
      <form onSubmit={this.onSubmitSearch} className={c(['search-box', className])}>
        <div className={c('bp3-input-group')}>
          <span className="bp3-icon bp3-icon-search" />
          <input
            className="bp3-input"
            type="search"
            dir="auto"
            placeholder={placeholder}
            onChange={this.onSearchChange}
            value={queryText || ''}
          />
        </div>
      </form>
    );
  }
}
export default injectIntl(SearchBox);
