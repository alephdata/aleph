import React, { Component } from 'react';
import {
  defineMessages, FormattedMessage, injectIntl,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { ButtonGroup } from '@blueprintjs/core';

import Query from 'src/app/Query';
import { queryCollections } from 'src/actions';
import { selectCollectionsResult } from 'src/selectors';
import {
  Breadcrumbs, DualPane, SignInCallout, ResultCount,
} from 'src/components/common';
import SearchFacets from 'src/components/Facet/SearchFacets';
import Screen from 'src/components/Screen/Screen';
import CollectionIndex from 'src/components/CollectionIndex/CollectionIndex';
import CaseCreateButton from 'src/components/Toolbar/CaseCreateButton';

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
    defaultMessage: 'No datasets were found',
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
        <CaseCreateButton />
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
          <ResultCount result={result} />
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
              placeholder={intl.formatMessage(messages.placeholder)}
              emptyText={intl.formatMessage(messages.empty)}
            />
          </DualPane.ContentPane>
        </DualPane>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  let query = Query.fromLocation('collections', location, {}, 'collections')
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
