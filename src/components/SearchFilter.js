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

const stateToFilter = {
  searchTerm: 'q',
  entityType: 'filter:schema'
};

const filterToState = invert(stateToFilter);

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    const filters = queryString.parse(props.location.search);
    this.state = mapValues(stateToFilter, filter => filters[filter] || '');

    this.onTextChange = this.onTextChange.bind(this);
    this.onEntityChange = this.onEntityChange.bind(this);

    this.debouncedUpdate = debounce(this.updateLocation, 250);
  }

  updateLocation() {
    const { history, location } = this.props;
    const params = mapValues(filterToState, s => this.state[s]);
    const nonEmptyParams = pickBy(params, v => !!v);

    history.push({
      pathname: location.pathname,
      search: queryString.stringify(nonEmptyParams)
    });
  }

  componentWillUpdate(nextProps, nextState) {
    if (!isEqual(nextState, this.state)) {
      this.debouncedUpdate();
    }
  }

  onTextChange(e) {
    this.setState({
      searchTerm: e.target.value
    });
  }

  onEntityChange(type) {
    this.setState({
      entityType: type === 'All' ? null : type
    });
  }

  render() {
    const { searchTerm, entityType } = this.state;
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
