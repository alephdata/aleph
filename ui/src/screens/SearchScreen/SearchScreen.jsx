import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { selectEntitiesResult } from 'selectors';
import { triggerQueryExport } from 'src/actions';
import { SignInCallout } from 'components/common';
import FacetedEntitySearch from 'components/EntitySearch/FacetedEntitySearch';
import Screen from 'components/Screen/Screen';
import { entitiesQuery } from 'queries';

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
  title_emptyq: {
    id: 'search.title_emptyq',
    defaultMessage: 'Search',
  },
  loading: {
    id: 'search.loading',
    defaultMessage: 'Loading...',
  },
});

export class SearchScreen extends React.Component {
  render() {
    const { query, result, intl } = this.props;

    const titleStatus = (result.isPending && !result.results?.length) ? intl.formatMessage(messages.loading) : query.getString('q');
    const title = titleStatus
      ? intl.formatMessage(messages.title, { title: titleStatus })
      : intl.formatMessage(messages.title_emptyq);

    return (
      <Screen title={title} >
        <FacetedEntitySearch
          query={query}
          result={result}
          additionalFields={['collection_id']}
        >
          <SignInCallout />
        </FacetedEntitySearch>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = entitiesQuery(location);
  const result = selectEntitiesResult(state, query);

  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { triggerQueryExport }),
  injectIntl,
)(SearchScreen);
