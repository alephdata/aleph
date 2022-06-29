{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter'
import { fetchEntitySet, queryEntities } from 'actions';
import { selectEntitySet, selectEntitiesResult } from 'selectors';
import { entitySetEntitiesQuery } from 'queries';
import Query from 'app/Query';
import Screen from 'components/Screen/Screen';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import CollectionWrapper from 'components/Collection/CollectionWrapper';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import Timeline from 'components/Timeline/Timeline';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { Breadcrumbs, SearchBox, UpdateStatus} from 'components/common';


export class TimelineScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      updateStatus: null
    }
    this.onStatusChange = this.onStatusChange.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entitiesCount, entitiesCountQuery, timeline, entitySetId } = this.props;

    if (timeline.shouldLoad) {
      this.props.fetchEntitySet({ id: entitySetId });
    }
    if (entitiesCount.shouldLoad) {
      this.props.queryEntities({ query: entitiesCountQuery });
    }
  }

  onSearch(queryText) {
    const { query } = this.props;
    const newQuery = query.set('q', queryText);
    this.updateQuery(newQuery)
  }

  updateQuery(newQuery) {
    const { navigate, location } = this.props;
    navigate({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash
    });
  }

  onStatusChange(updateStatus) {
    this.setState({ updateStatus });
  }

  render() {
    const { entitiesCount, query, result, timeline } = this.props;
    const { updateStatus } = this.state;

    if (timeline.isError) {
      return <ErrorScreen error={timeline.error} />;
    }

    if (timeline.id === undefined) {
      return <LoadingScreen />;
    }

    const search = (
      <SearchBox
        query={query}
        onSearch={this.onSearch}
        placeholderLabel={timeline.label}
      />
    );

    const operation = (
      <EntitySetManageMenu entitySet={timeline} />
    );

    const status = <UpdateStatus status={updateStatus} />;

    const breadcrumbs = (
      <Breadcrumbs operation={operation} search={search} status={status}>
        <Breadcrumbs.Text>
          <CollectionView.Link id={collectionViewIds.TIMELINES} collection={timeline.collection} icon />
        </Breadcrumbs.Text>
        <Breadcrumbs.EntitySet key="timeline" entitySet={timeline} icon={false}/>
      </Breadcrumbs>
    );

    return (
      <Screen
        title={timeline.label}
        description={timeline.summary || ''}
      >
        <CollectionWrapper collection={timeline.collection}>
          {breadcrumbs}
          <Timeline
            query={query}
            timeline={timeline}
            collection={timeline.collection}
            entities={result?.results}
            entitiesCount={entitiesCount}
            onStatusChange={this.onStatusChange}
            mutateOnUpdate
          />
        </CollectionWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, params } = ownProps;
  const { entitySetId } = params;

  const timeline = selectEntitySet(state, entitySetId);
  const query = entitySetEntitiesQuery(location, entitySetId, null)
    .add('facet', 'dates')
    .add('facet_interval:dates', 'year')
    .defaultFacet('schema')
    .defaultFacet('names')
    .defaultFacet('addresses')
    .defaultSortBy('properties.date', 'asc')
    .limit(1000);

  const entitiesCountQuery = new Query(`entitysets/${entitySetId}/entities`, {}, {}, 'entitySetEntities').limit(0)

  return {
    entitySetId,
    timeline,
    query,
    entitiesCountQuery,
    entitiesCount: selectEntitiesResult(state, entitiesCountQuery),
    result: selectEntitiesResult(state, query)
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet, queryEntities }),
)(TimelineScreen);
