import React, { Component } from 'react';
import { NonIdealState } from '@blueprintjs/core';
import Waypoint from 'react-waypoint';
import { defineMessages, injectIntl } from 'react-intl';

import EntityList from 'src/components/EntityScreen/EntityList';
import SectionLoading from 'src/components/common/SectionLoading';

const messages = defineMessages({
  no_results_title: {
    id: 'search.no_results_title',
    defaultMessage: 'No search results',
  },
  no_results_description: {
    id: 'search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
})

class SearchResult extends Component {
  render() {
    const { result, hasMoreResults, getMoreResults, intl } = this.props;

    if (result === undefined || result.isFetching) {
      return (
        <SectionLoading />
      );
    }
    return (
      <div>
        { result.total === 0 &&
          <NonIdealState visual="search" title={intl.formatMessage(messages.no_results_title)}
            description={intl.formatMessage(messages.no_results_description)} />
        }
        <EntityList {...this.props} result={result} />
        { !result.isExpanding && hasMoreResults && (
          <Waypoint
            onEnter={getMoreResults}
            bottomOffset="-600px"
            scrollableAncestor={window}
          />
        )}
        { result.isExpanding && (
          <SectionLoading />
        )}
      </div>
    );
  }
}

export default injectIntl(SearchResult);
