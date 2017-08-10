import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from '@blueprintjs/core';

import queryString from 'query-string';
import debounce from 'lodash/debounce';

import './Search.css';

class Search extends Component {
  constructor(props)  {
    super(props);

    const params = queryString.parse(props.location.search);

    this.state = {
      searchTerm: params.q || ''
    }

    this.onChange = this.onChange.bind(this);
    this.updateLocation = this.updateLocation.bind(this);

    this.debouncedUpdate = debounce(this.updateLocation, 250);
  }

  updateLocation(searchTerm) {
    const { history, location } = this.props;

    const params = queryString.parse(location.search);
    const newParams = { ...params, q: searchTerm };

    if (!searchTerm) {
      delete newParams.q;
    }

    history.push({
      pathname: location.pathname,
      search: queryString.stringify(newParams)
    });
  }

  componentWillUpdate(nextProps, { searchTerm }) {
    if (searchTerm !== this.state.searchTerm) {
      this.debouncedUpdate(searchTerm);
    }
  }

  onChange(e) {
    this.setState({
      searchTerm: e.target.value
    });
  }

  render() {
    const { searchTerm } = this.state;

    return (
      <form className="top">
        <div className="top__search pt-input-group pt-large">
          <span className="pt-icon pt-icon-search"/>
          <input className="pt-input" type="search" onChange={this.onChange} value={searchTerm}/>
        </div>
        <div className="pt-large">
          <Button rightIconName="caret-down">
            <FormattedMessage id="search.collections" defaultMessage="Collections"/>
            {' '}(55)
          </Button>
        </div>
      </form>
    );
  }
}

export default Search;
