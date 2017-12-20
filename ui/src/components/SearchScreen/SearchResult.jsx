import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NonIdealState, Spinner } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';
import uniqBy from 'lodash/uniqBy';

import { fetchNextSearchResults } from 'src/actions';

import EntityList from 'src/components/EntityScreen/EntityList';

class SearchResult extends Component {
  constructor(props) {
    super(props);
    this.state = {
        isExpanding: false,
        result: props.result
    };
    this.bottomReachedHandler = this.bottomReachedHandler.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isExpanding: false,
      result: nextProps.result
    })
  }

  bottomReachedHandler() {
    const { fetchNextSearchResults } = this.props;
    const { result } = this.state;

    if (result.next) {
      this.setState({isExpanding: true})

      fetchNextSearchResults({ next: result.next }).then((res) => {
        res.result.results = uniqBy([...result.results, ...res.result.results], 'id');
        this.setState({
            result: res.result,
            isExpanding: false
        });
      });
    }
  }

  render() {
    const { result, isExpanding } = this.state;
    return (
      <div>
        { result.total === 0 &&
          <NonIdealState visual="search" title="No search results"
            description="Try making your search more general" />}
        <EntityList result={result}/>
        { result.next && (isExpanding ?
          <div className="results-loading"><Spinner /></div>
          : <Waypoint onEnter={this.bottomReachedHandler} />
        )}
      </div>
    );
    
  }
}

SearchResult = connect(null, { fetchNextSearchResults })(SearchResult);

export default SearchResult;
