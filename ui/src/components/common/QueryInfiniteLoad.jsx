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
    if (result && result.next && !result.isPending && !result.isError) {
      this.props.fetch({ query, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.fetch({ query });
    }
  }

  render() {
    return (
      <Waypoint
        onEnter={this.getMoreResults}
        bottomOffset="-300px"
        scrollableAncestor={window}
      />
    );
  }
}

export default QueryInfiniteLoad;
