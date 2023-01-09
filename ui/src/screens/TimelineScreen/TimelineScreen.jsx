import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import {
  fetchEntitySet,
  queryEntities,
  entitySetAddEntity,
  updateEntitySet,
  updateEntitySetItemMutate,
} from 'actions';
import { selectModel, selectEntitySet, selectEntitiesResult } from 'selectors';
import { entitySetEntitiesQuery, entitySuggestQuery } from 'queries';
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

    this.fetchEntitySuggestions = this.fetchEntitySuggestions.bind(this);
    this.onEntityCreateOrUpdate = this.onEntityCreateOrUpdate.bind(this);
    this.onEntityRemove = this.onEntityRemove.bind(this);
    this.onLayoutUpdate = this.onLayoutUpdate.bind(this);
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

  async fetchEntitySuggestions(schema, queryText) {
    const { queryEntities, location, timeline, model } = this.props;
    const query = entitySuggestQuery(
      location,
      timeline?.collection,
      schema.name,
      { prefix: queryText }
    );
    const response = await queryEntities({ query });

    return (response.result?.results || []).map((result) =>
      model.getEntity(result)
    );
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

  async saveChanges(callback) {
    try {
      this.setState({ updateStatus: UpdateStatus.IN_PROGRESS });
      const result = await callback();
      this.setState({ updateStatus: UpdateStatus.SUCCESS });
      return result;
    } catch (error) {
      this.setState({ updateStatus: UpdateStatus.ERROR });
      throw error;
    }
  }

  async onEntityCreateOrUpdate(entity) {
    const { model, entitySetId, entitySetAddEntity } = this.props;

    const result = await this.saveChanges(() =>
      entitySetAddEntity({ entitySetId, entity, sync: true })
    );

    return model.getEntity({
      id: result.data.id,
      schema: result.data.schema,
      properties: result.data.properties,
    });
  }

  async onEntityRemove(entity) {
    const { entitySetId, updateEntitySetItemMutate } = this.props;

    this.saveChanges(() =>
      updateEntitySetItemMutate({
        entitySetId,
        entityId: entity.id,
        // The API to remove an entity from an entity set (without deleting
        // the entity itself) is weird because entity sets are (or have been)
        // also used to model entity profiles. Setting `no_judgement` will de
        // facto remove the entity from the entity set.
        judgement: 'no_judgement',
      })
    );
  }

  async onLayoutUpdate(layout) {
    const { entitySetId, updateEntitySet } = this.props;

    const entitySet = {
      layout: {
        edges: [],
        ...layout,
      },
    };

    this.saveChanges(() => updateEntitySet(entitySetId, entitySet));
  }

  render() {
    const { model, timeline, entities } = this.props;
    const { updateStatus } = this.state;

    if (timeline.isError || entities.isError) {
      return <ErrorScreen error={timeline.error || entities.error} />;
    }

    // `isPending` will be true every time the query is loaded, including when
    // it's refreshed due to mutations. We only want to show a loading indicator
    // on first load, so we check if data has been loaded previously.
    // TODO: It may be agood idea to add this to our data loading abstraction
    // (for example as `isRefreshing`) rather than implementing this here.
    if (
      (timeline.isPending && !timeline.id) ||
      (entities.isPending && !entities.page)
    ) {
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
          <Timeline
            model={model}
            entities={entities.results}
            layout={timeline.layout}
            fetchEntitySuggestions={this.fetchEntitySuggestions}
            onEntityCreateOrUpdate={this.onEntityCreateOrUpdate}
            onEntityRemove={this.onEntityRemove}
            onLayoutUpdate={this.onLayoutUpdate}
          />
        </CollectionWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, params } = ownProps;
  const { entitySetId } = params;

  const model = selectModel(state);
  const timeline = selectEntitySet(state, entitySetId);
  const entitiesQuery = entitySetEntitiesQuery(location, entitySetId, null)
    .defaultSortBy('properties.date', 'asc')
    .limit(1000);
  const entities = selectEntitiesResult(state, entitiesQuery);

  return {
    model,
    entitySetId,
    entitiesQuery,
    timeline,
    entities,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, {
    fetchEntitySet,
    queryEntities,
    entitySetAddEntity,
    updateEntitySet,
    updateEntitySetItemMutate,
  })
)(TimelineScreen);
