import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { InputGroup } from '@blueprintjs/core';


const messages = defineMessages({
  search_placeholder: {
    id: 'search.placeholder_default',
    defaultMessage: 'Search…',
  },
});

export class SearchBox extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
    this.onQueryTextChange = this.onQueryTextChange.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextQueryText = nextProps.query ? nextProps.query.getString('q') : prevState.queryText;
    const queryChanged = !prevState?.prevQuery || prevState.prevQuery.getString('q') !== nextQueryText;
    return {
      prevQuery: nextProps.query,
      queryText: queryChanged ? nextQueryText : prevState.queryText,
    };
  }

  onQueryTextChange(e) {
    const queryText = e.target.value;
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
    const { intl, placeholder, className, inputProps } = this.props;
    const { queryText } = this.state;
    const searchPlaceholder = placeholder || intl.formatMessage(messages.search_placeholder);
    if (!this.props.onSearch) {
      return null;
    }
    return (
      <form onSubmit={this.onSubmitSearch} className={className}>
        <InputGroup
          fill
          leftIcon="search"
          onChange={this.onQueryTextChange}
          placeholder={searchPlaceholder}
          value={queryText}
          {...inputProps}
        />
      </form>
    );
  }
}
export default injectIntl(SearchBox);
