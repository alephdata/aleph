import React, { Component } from 'react';
import { Waypoint } from 'react-waypoint';


class QueryInfiniteLoad extends Component {
  constructor(props) {
    super(props);
    this.getMoreResults = this.getMoreResults.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  getMoreResults() {
    const { query, result } = this.props;
    this.props.fetch({ query, result, next: result.next });
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.fetch({ query, result });
    }
  }

  render() {
    const { result } = this.props;
    const canLoadMore = result && result.next && !result.isPending && !result.isError;

    if (canLoadMore) {
      return (
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-100px"
          scrollableAncestor={window}
        />
      );
    }

    return null;
  }
}

export default QueryInfiniteLoad;
