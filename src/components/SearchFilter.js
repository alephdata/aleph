import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';

import queryString from 'query-string';
import { debounce, isEqual, pickBy } from 'lodash';

import SearchFilterSchema from './SearchFilterSchema';

import './SearchFilter.css';

class SearchFilter extends Component {
  constructor(props)  {
    super(props);

    this.state = {
      params: queryString.parse(props.location.search)
    };

    this.onTextChange = this.onTextChange.bind(this);
    this.onSchemaChange = this.onSchemaChange.bind(this);

    this.debouncedUpdate = debounce(this.updateLocation, 250);
  }

  updateLocation() {
    const { history, location } = this.props;
    const nonEmptyParams = pickBy(this.state.params, v => !!v);

    history.push({
      pathname: location.pathname,
      search: queryString.stringify(nonEmptyParams)
    });
  }

  componentWillUpdate(nextProps, { params }) {
    if (!isEqual(params, this.state.params)) {
      this.debouncedUpdate();
    }
  }

  handleParamChange(param, newValue) {
    this.setState({
      params: {
        ...this.state.params,
        [param]: newValue
      }
    });
  }

  onTextChange(e) {
    this.handleParamChange('q', e.target.value);
  }

  onSchemaChange(type) {
    this.handleParamChange('filter:schema', type);
  }

  render() {
    const { params } = this.state;
    const { result } = this.props;

    return (
      <div className="search-filter">
        <div className="search-query">
          <div className="search-query__text pt-input-group pt-large">
            <span className="pt-icon pt-icon-search"/>
            <input className="pt-input" type="search" onChange={this.onTextChange}
              value={params.q}/>
          </div>
          <div className="search-query__button pt-large">
            <Button rightIconName="caret-down">
              <FormattedMessage id="search.collections" defaultMessage="Countries"/>
              {' '}(41)
            </Button>
          </div>
          <div className="search-query__button pt-large">
            <Button rightIconName="caret-down">
              <FormattedMessage id="search.collections" defaultMessage="Collections"/>
              {' '}(55)
            </Button>
          </div>
        </div>
        { result.total > 0 &&
          <SearchFilterSchema onChange={this.onSchemaChange} result={result}
            value={params['filter:schema']} /> }
      </div>
    );
  }
}

export default SearchFilter;
