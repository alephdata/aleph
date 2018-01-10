import React, { Component } from 'react';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';

import { fetchNextSearchResults } from 'src/actions';

import EntityList from 'src/components/EntityScreen/EntityList';
import SectionLoading from 'src/components/common/SectionLoading';

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
    let { result } = this.state;

    if (result.next) {
      this.setState({isExpanding: true});
      fetchNextSearchResults({ next: result.next }).then(({result: fresh}) => {
        result.next = fresh.next;
        result.results.push(...fresh.results);
        this.setState({
            result: result,
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
        <EntityList {...this.props} result={result} />
        { result.next && (
          <Waypoint onEnter={this.bottomReachedHandler} />
        )}
        { isExpanding && (
          <SectionLoading />
        )}
      </div>
    );
    
  }
}

SearchResult = connect(null, { fetchNextSearchResults })(SearchResult);
export default SearchResult;
