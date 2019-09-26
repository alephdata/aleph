import React, { Component } from 'react';
import {
  defineMessages, injectIntl, FormattedMessage,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Waypoint } from 'react-waypoint';

import Query from 'src/app/Query';
import Dashboard from 'src/components/Dashboard/Dashboard';
import { SectionLoading, ErrorSection } from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import CollectionListItem from 'src/components/Collection/CollectionListItem';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import { queryCollections, fetchGroups } from 'src/actions';
import { selectCollectionsResult, selectGroups } from 'src/selectors';

import './GroupScreen.scss';


const messages = defineMessages({
  empty: {
    id: 'sources.index.empty',
    defaultMessage: 'This group is not linked to any datasets.',
  },
});


export class GroupScreen extends Component {
  constructor(props) {
    super(props);
    this.updateQuery = this.updateQuery.bind(this);
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
    if (result && !result.isLoading && result.next && !result.isError) {
      this.props.queryCollections({ query, result, next: result.next });
    }
  }

  fetchIfNeeded() {
    const { query, result, groups } = this.props;
    if (groups.shouldLoad) {
      this.props.fetchGroups();
    }
    if (result.shouldLoad) {
      this.props.queryCollections({ query });
    }
  }

  updateQuery(newQuery) {
    const { history, location } = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation(),
    });
  }

  render() {
    const { result, group, intl } = this.props;
    if (!group || !group.id) {
      return <LoadingScreen />;
    }
    return (
      <Screen className="GroupScreen" title={group.label} requireSession>
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{group.label}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="group.page.description"
                defaultMessage="The list below shows all datasets that belong to this group."
              />
            </p>
          </div>
          {result.isError && (
            <ErrorSection error={result.error} />
          )}
          {result.total === 0 && (
            <ErrorSection
              icon="shield"
              title={intl.formatMessage(messages.empty)}
            />
          )}
          <ul className="results">
            {result.results !== undefined && result.results.map(
              res => <CollectionListItem key={res.id} collection={res} />,
            )}
          </ul>
          <Waypoint
            onEnter={this.getMoreResults}
            bottomOffset="-300px"
            scrollableAncestor={window}
          />
          {result.isLoading && (
            <SectionLoading />
          )}
        </Dashboard>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { groupId } = ownProps.match.params;
  const context = {
    'filter:kind': 'source',
  };
  const query = Query.fromLocation('collections', {}, context, 'collections')
    .setFilter('team_id', groupId)
    .sortBy('count', 'desc')
    .limit(20);

  const groups = selectGroups(state);
  const group = groups.results && groups.results.find(accessGroup => (
    accessGroup.id === groupId
  ));

  return {
    query,
    group,
    groups,
    result: selectCollectionsResult(state, query),
  };
};

export default compose(
  connect(mapStateToProps, { fetchGroups, queryCollections }),
  injectIntl,
)(GroupScreen);
