import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'app/Query';
import { selectEntitiesResult } from 'selectors';
import { triggerQueryExport } from 'src/actions';
import { SignInCallout } from 'components/common';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import Screen from 'components/Screen/Screen';

import './SearchScreen.scss';

const messages = defineMessages({
  no_results_title: {
    id: 'search.no_results_title',
    defaultMessage: 'No search results',
  },
  no_results_description: {
    id: 'search.no_results_description',
    defaultMessage: 'Try making your search more general',
  },
  title: {
    id: 'search.title',
    defaultMessage: 'Search: {title}',
  },
  loading: {
    id: 'search.loading',
    defaultMessage: 'Loading...',
  },
});

export class SearchScreen extends React.Component {
  render() {
    const { query, result, intl } = this.props;
    const titleStatus = result.query_text ? result.query_text : intl.formatMessage(messages.loading);
    const title = intl.formatMessage(messages.title, { title: titleStatus });

    return (
      <Screen title={title} >
        <FacetedEntitySearch
          query={query}
          result={result}
          additionalFacets={['collection_id']}
        >
          <SignInCallout />
        </FacetedEntitySearch>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  // We normally only want Things, not Intervals (relations between things).
  const context = {
    highlight: true,
    'filter:schemata': 'Thing',
  };

  const query = Query.fromLocation('entities', location, context, '');
  const result = selectEntitiesResult(state, query);

  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { triggerQueryExport }),
  injectIntl,
)(SearchScreen);
