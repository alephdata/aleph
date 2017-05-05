import React, { Component } from 'react';
import queryString from 'query-string';
import debounce from 'lodash/debounce';

class Search extends Component {
  constructor(props)  {
    super(props);

    const params = queryString.parse(props.location.search);

    this.state = {
      searchTerm: params.search || ''
    }

    this.onChange = this.onChange.bind(this);
    this.updateLocation = this.updateLocation.bind(this);

    this.debouncedUpdate = debounce(this.updateLocation, 250);
  }

  updateLocation(searchTerm) {
    const { history, location } = this.props;
    
    const params = queryString.parse(location.search);
    const newParams = { ...params, search: searchTerm };

    if (!searchTerm) {
      delete newParams.search;
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
      <input type="text" onChange={this.onChange} value={searchTerm} />
    );
  }
}

export default Search;