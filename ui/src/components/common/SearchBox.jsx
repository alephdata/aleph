{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React, { PureComponent } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { InputGroup } from '@blueprintjs/core';


const messages = defineMessages({
  placeholder: {
    id: 'search.placeholder_default',
    defaultMessage: 'Search…',
  },
  placeholder_label: {
    id: 'search.placeholder_label',
    defaultMessage: 'Search in {label}',
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
    const { intl, placeholder, placeholderLabel, className, inputProps } = this.props;
    const { queryText } = this.state;
    if (!this.props.onSearch) {
      return null;
    }

    let searchPlaceholder = intl.formatMessage(messages.placeholder);
    if (placeholder) {
      searchPlaceholder = placeholder
    } else if (placeholderLabel) {
      searchPlaceholder = intl.formatMessage(messages.placeholder_label, { label: placeholderLabel })
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
