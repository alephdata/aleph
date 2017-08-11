import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';

import queryString from 'query-string';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import invert from 'lodash/invert';
import mapValues from 'lodash/mapValues';
import pickBy from 'lodash/pickBy';

import SearchFilterEntities from './SearchFilterEntities';

import './SearchFilter.css';

const stateToParam = {
  searchTerm: 'q',
  entityType: 'filter:schema'
};

const paramToState = invert(stateToParam);

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    const params = queryString.parse(props.location.search);
    this.state = {
      filters: mapValues(stateToParam, param => params[param] || '')
    };

    this.onTextChange = this.onTextChange.bind(this);
    this.onEntityChange = this.onEntityChange.bind(this);

    this.debouncedUpdate = debounce(this.updateLocation, 250);
  }

  updateLocation() {
    const { history, location } = this.props;
    const params = mapValues(paramToState, s => this.state.filters[s]);
    const nonEmptyParams = pickBy(params, v => !!v);

    history.push({
      pathname: location.pathname,
      search: queryString.stringify(nonEmptyParams)
    });
  }

  componentWillUpdate(nextProps, { filters }) {
    if (!isEqual(filters, this.state.filters)) {
      this.debouncedUpdate();
    }
  }

  onTextChange(e) {
    this.setState({
      filters: {
        ...this.state.filters,
        searchTerm: e.target.value
      }
    });
  }

  onEntityChange(type) {
    this.setState({
      filters: {
        ...this.state.filters,
        entityType: type === 'All' ? null : type
      }
    });
  }

  render() {
    const { searchTerm, entityType } = this.state.filters;
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
        { result.total > 0 &&
          <SearchFilterEntities onChange={this.onEntityChange} result={result} value={entityType} /> }
      </div>
    );
  }
}

export default SearchFilter;
