import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NonIdealState, Spinner } from '@blueprintjs/core';
import debounce from 'lodash/debounce';

import { fetchNextSearchResults } from '../actions';

import SearchResultListItem from './SearchResultListItem';

import './SearchResultList.css';

class SearchResultList extends Component {
  componentDidMount() {
    this.handler = debounce(this.handler.bind(this), 100);

    window.addEventListener('resize', this.handler);
    window.addEventListener('scroll', this.handler);
  }

  componentDidUnmount() {
    window.removeEventListener('resize', this.handler);
    window.removeEventListener('scroll', this.handler);
  }

  handler() {
    const { result, fetchNextSearchResults } = this.props;
    if (result.next && (window.innerHeight + window.scrollY) >= document.body.offsetHeight - 100) {
      fetchNextSearchResults();
    }
  }

  render() {
    const { result } = this.props;

    return (
      <div>
        { !result.isFetching && result.results.length === 0 &&
          <NonIdealState visual="search" title="No search results"
            description="Try making your search more general" />}
        <table className="results-table pt-table pt-striped">
          <tbody>
            {result.results.map(item => <SearchResultListItem key={item.id} result={item} />)}
          </tbody>
        </table>
        { result.next && <div className="results-loading"><Spinner /></div> }
      </div>
    );
  }
}

SearchResultList = connect(null, { fetchNextSearchResults })(SearchResultList);

export default SearchResultList;
