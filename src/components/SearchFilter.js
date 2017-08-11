import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Button, Tab2, Tabs2 } from '@blueprintjs/core';

import queryString from 'query-string';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

import './SearchFilter.css';

const schemas = [
  {
    'id': 'Document',
    'label': 'Documents'
  },
  {
    'id': 'Person',
    'label': 'People'
  },
  {
    'id': 'Company',
    'label': 'Companies'
  },
  {
    'id': 'LegalEntity',
    'label': 'Legal Entities'
  }
];

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    const params = queryString.parse(props.location.search);

    this.state = {
      searchTerm: params.q || ''
    };

    this.onTextChange = this.onTextChange.bind(this);
    this.onEntityChange = this.onTextChange.bind(this);

    this.debouncedUpdate = debounce(this.updateLocation, 250);
  }

  updateLocation({ searchTerm, entityType }) {
    const { history, location } = this.props;

    const params = queryString.parse(location.search);
    const newParams = { ...params, q: searchTerm, e: entityType};

    if (!searchTerm) {
      delete newParams.q;
    }
    if (!entityType) {
      delete newParams.e;
    }

    history.push({
      pathname: location.pathname,
      search: queryString.stringify(newParams)
    });
  }

  componentWillUpdate(nextProps, props) {
    if (!isEqual(nextProps, props)) {
      this.debouncedUpdate(props);
    }
  }

  onTextChange(e) {
    this.setState({searchTerm: e.target.value});
  }

  onEntityChange(entityType) {
    this.setState({entityType});
  }

  render() {
    const { searchTerm } = this.state;
    const { result } = this.props;

    return (
      <div className="search-filter">
        <div className="search-query">
          <div className="search-query__text pt-input-group pt-large">
            <span className="pt-icon pt-icon-search"/>
            <input className="pt-input" type="search" onChange={this.onTextChange} value={searchTerm}/>
          </div>
          <div className="pt-large">
            <Button rightIconName="caret-down">
              <FormattedMessage id="search.collections" defaultMessage="Collections"/>
              {' '}(55)
            </Button>
          </div>
        </div>
        <Tabs2 id="entityTypes" className="pt-large pt-dark" onChange={this.onEntityChange}>
          <Tab2 id="All">
            <FormattedMessage id="search.entities.All" defaultMessage="All Results"/>
            { !result.isFetching && <span> (<FormattedNumber value={result.total} />)</span> }
          </Tab2>
          {schemas.map(schema => (
            <Tab2 id={schema.id} key={schema.id}>
              <FormattedMessage id={`search.entities.${schema.id}`} defaultMessage={schema.label}/>
              {' '}(0)
            </Tab2>
          ))}
        </Tabs2>
      </div>
    );
  }
}

export default SearchFilter;
