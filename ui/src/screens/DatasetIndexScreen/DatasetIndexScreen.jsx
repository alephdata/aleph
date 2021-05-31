import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { getGroupField } from 'components/SearchField/util';
import { selectCollectionsResult } from 'selectors';
import { DualPane, SignInCallout } from 'components/common';
import Facets from 'components/Facet/Facets';
import Screen from 'components/Screen/Screen';
import CollectionIndex from 'components/CollectionIndex/CollectionIndex';
import { datasetsQuery } from 'queries';

import './DatasetIndexScreen.scss';


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
  no_results: {
    id: 'collection.index.no_results',
    defaultMessage: 'No datasets were found matching this query.',
  },
});

const facetKeys = ['category', 'countries'];

export class DatasetIndexScreen extends Component {
  constructor(props) {
    super(props);
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

    return (
      <Screen
        className="DatasetIndexScreen"
        title={intl.formatMessage(messages.title)}
      >
        <DualPane>
          <DualPane.SidePane>
            <Facets
              facets={facetKeys.map(getGroupField)}
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
  const query = datasetsQuery(location);
  return {
    query,
    result: selectCollectionsResult(state, query),
  };
};

export default compose(
  connect(mapStateToProps, {}),
  injectIntl,
)(DatasetIndexScreen);
