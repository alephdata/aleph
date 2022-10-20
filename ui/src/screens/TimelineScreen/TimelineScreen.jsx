import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import { fetchEntitySet, queryEntities } from 'actions';
import { selectEntitySet, selectEntitiesResult } from 'selectors';
import { entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import CollectionWrapper from 'components/Collection/CollectionWrapper';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { Breadcrumbs, UpdateStatus } from 'components/common';
import { Timeline } from 'components/Timeline2';

export class TimelineScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      updateStatus: null,
    };

    this.onStatusChange = this.onStatusChange.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const {
      entitySetId,
      timeline,
      entities,
      fetchEntitySet,
      queryEntities,
      entitiesQuery,
    } = this.props;

    if (timeline.shouldLoad) {
      fetchEntitySet({ id: entitySetId });
    }

    if (entities.shouldLoad) {
      queryEntities({ query: entitiesQuery });
    }
  }

  onSearch(queryText) {
    const { query } = this.props;
    const newQuery = query.set('q', queryText);
    this.updateQuery(newQuery);
  }

  updateQuery(newQuery) {
    const { navigate, location } = this.props;
    navigate({
      pathname: location.pathname,
      search: newQuery.toLocation(),
      hash: location.hash,
    });
  }

  onStatusChange(updateStatus) {
    this.setState({ updateStatus });
  }

  render() {
    const { timeline, entities } = this.props;
    const { updateStatus } = this.state;

    if (timeline.isError) {
      return <ErrorScreen error={timeline.error} />;
    }

    if (timeline.id === undefined) {
      return <LoadingScreen />;
    }

    const operation = <EntitySetManageMenu entitySet={timeline} />;
    const status = <UpdateStatus status={updateStatus} />;

    const breadcrumbs = (
      <Breadcrumbs operation={operation} status={status}>
        <Breadcrumbs.Text>
          <CollectionView.Link
            id={collectionViewIds.TIMELINES}
            collection={timeline.collection}
            icon
          />
        </Breadcrumbs.Text>
        <Breadcrumbs.EntitySet
          key="timeline"
          entitySet={timeline}
          icon={false}
        />
      </Breadcrumbs>
    );

    return (
      <Screen title={timeline.label} description={timeline.summary || ''}>
        <CollectionWrapper collection={timeline.collection}>
          {breadcrumbs}
          <Timeline entities={entities.results} layout={timeline.layout} />
        </CollectionWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, params } = ownProps;
  const { entitySetId } = params;

  const timeline = selectEntitySet(state, entitySetId);
  const entitiesQuery = entitySetEntitiesQuery(location, entitySetId, null)
    .defaultSortBy('properties.date', 'asc')
    .limit(1000);
  const entities = selectEntitiesResult(state, entitiesQuery);

  return {
    entitySetId,
    entitiesQuery,
    timeline,
    entities,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet, queryEntities })
)(TimelineScreen);
