// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Waypoint } from 'react-waypoint';
import { Button } from '@blueprintjs/core';

import './QueryInfiniteLoad.scss';

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
    const { loadOnScroll = true, result } = this.props;
    const canLoadMore = result && result.next && !result.isPending && !result.isError && result.results.length < result.total;

    if (canLoadMore) {
      if (loadOnScroll) {
        return (
          <Waypoint
            onEnter={this.getMoreResults}
            bottomOffset="-100px"
            scrollableAncestor={window}
          />
        );
      } else {
        return (
          <div className="QueryInfiniteLoad">
            <Button
              onClick={this.getMoreResults}
              className="QueryInfiniteLoad__button"
            >
              <FormattedMessage
                id="screen.load_more"
                defaultMessage="Load more"
              />
            </Button>
          </div>
        );
      }
    }

    return null;
  }
}

export default injectIntl(QueryInfiniteLoad);
