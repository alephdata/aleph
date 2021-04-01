import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchEntitySet } from 'actions';
import { selectEntitySet, selectEntitiesResult } from 'selectors';
import { entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import CollectionWrapper from 'components/Collection/CollectionWrapper';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import Timeline from 'components/Timeline/Timeline';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { Breadcrumbs, UpdateStatus} from 'components/common';

import './TimelineScreen.scss';

export class TimelineScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      updateStatus: null
    }
    this.onStatusChange = this.onStatusChange.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { timeline, entitySetId } = this.props;

    if (timeline.shouldLoad) {
      this.props.fetchEntitySet({ id: entitySetId });
    }
  }

  onStatusChange(updateStatus) {
    this.setState({ updateStatus });
  }

  render() {
    const { entitiesQuery, entitiesResult, timeline, updateStatus } = this.props;

    if (timeline.isError) {
      return <ErrorScreen error={timeline.error} />;
    }

    if (timeline.id === undefined) {
      return <LoadingScreen />;
    }

    const operation = (
      <EntitySetManageMenu entitySet={timeline} />
    );

    const status = <UpdateStatus status={updateStatus} />;

    const breadcrumbs = (
      <Breadcrumbs operation={operation} status={status}>
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
            query={entitiesQuery}
            entities={entitiesResult?.results}
            collection={timeline.collection}
            onStatusChange={this.onStatusChange}
            mutateOnUpdate
          />
        </CollectionWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, match } = ownProps;
  const { entitySetId } = match.params;

  const timeline = selectEntitySet(state, entitySetId);
  const entitiesQuery = entitySetEntitiesQuery(location, entitySetId, null, 1000)
    .add('facet', 'dates')
    .add('facet_interval:dates', 'year')
    .defaultSortBy('properties.date', 'asc')

  return {
    entitySetId,
    timeline,
    entitiesQuery,
    entitiesResult: selectEntitiesResult(state, entitiesQuery)
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet }),
)(TimelineScreen);
