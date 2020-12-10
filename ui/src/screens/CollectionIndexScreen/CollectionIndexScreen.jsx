import React, { Component } from 'react';
import {
  defineMessages, FormattedMessage, injectIntl,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ButtonGroup } from '@blueprintjs/core';

import Query from 'app/Query';
import { queryCollections } from 'actions';
import { selectCollectionsResult } from 'selectors';
import {
  Breadcrumbs, DualPane, SignInCallout, ResultText,
} from 'components/common';
import SearchFacets from 'components/Facet/SearchFacets';
import Screen from 'components/Screen/Screen';
import CollectionIndex from 'components/CollectionIndex/CollectionIndex';
import CaseCreateButton from 'components/Toolbar/CaseCreateButton';

import './CollectionIndexScreen.scss';


const messages = defineMessages({
  title: {
    id: 'collection.index.title',
    defaultMessage: 'Datasets',
  },
  placeholder: {
    id: 'collection.index.placeholder',
    defaultMessage: 'Search datasets...',
  },
  empty: {
    id: 'collection.index.empty',
    defaultMessage: 'No datasets were found.',
  },
  create: {
    id: 'collection.index.create',
    defaultMessage: 'New dataset',
  },
  no_results: {
    id: 'collection.index.no_results',
    defaultMessage: 'No datasets were found matching this query.',
  },
});

const facetKeys = [
  'category', 'countries',
];

export class CollectionIndexScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      facets: facetKeys,
    };

    this.updateQuery = this.updateQuery.bind(this);
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  render() {
    const { result, query, intl } = this.props;
    const operation = (
      <ButtonGroup>
        <CaseCreateButton
          icon="database"
          text={intl.formatMessage(messages.create)}
        />
      </ButtonGroup>
    );
    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Text icon="database">
          <FormattedMessage
            id="collection.index.breadcrumb"
            defaultMessage="Datasets"
          />
        </Breadcrumbs.Text>
        <Breadcrumbs.Text active>
          <ResultText result={result} />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );

    return (
      <Screen
        className="CollectionIndexScreen"
        title={intl.formatMessage(messages.title)}
      >
        {breadcrumbs}
        <DualPane>
          <DualPane.SidePane>
            <SearchFacets
              facets={this.state.facets}
              query={query}
              result={result}
              updateQuery={this.updateQuery}
            />
          </DualPane.SidePane>
          <DualPane.ContentPane>
            <SignInCallout />
            <CollectionIndex
              query={query}
              showQueryTags
              icon="database"
              placeholder={intl.formatMessage(messages.placeholder)}
              emptyText={intl.formatMessage(messages.empty)}
              noResultsText={intl.formatMessage(messages.no_results)}
            />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const context = {
    'exclude:category': 'casefile'
  };
  let query = Query.fromLocation('collections', location, context, 'collections')
    .defaultFacet('countries')
    .defaultFacet('category')
    .limit(40);

  if (!query.hasSort()) {
    query = query.sortBy('created_at', 'desc');
  }

  return {
    query,
    result: selectCollectionsResult(state, query),
  };
};

export default compose(
  connect(mapStateToProps, { queryCollections }),
  injectIntl,
)(CollectionIndexScreen);
