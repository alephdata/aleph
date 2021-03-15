import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { Button, ButtonGroup } from '@blueprintjs/core';

import { fetchEntitySet, queryEntitySetEntities } from 'actions';
import { selectEntitySet, selectEntitiesResult, selectModel } from 'selectors';
import { entitySetSchemaCountsQuery, entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntityTable from 'components/EntityTable/EntityTable';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import CollectionWrapper from 'components/Collection/CollectionWrapper';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import Timeline from 'components/Timeline/Timeline';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { Breadcrumbs, DualPane, UpdateStatus} from 'components/common';

import './TimelineScreen.scss';

export class TimelineScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      updateStatus: null
    }
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { timeline, countsResult, countsQuery, entitySetId } = this.props;

    if (timeline.shouldLoad) {
      this.props.fetchEntitySet({ id: entitySetId });
    }
  }

  onStatusChange(updateStatus) {
    this.setState({ updateStatus });
  }

  render() {
    const { activeSchema, entitiesQuery, timeline, updateStatus, querySchemaEntities } = this.props;

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
          <DualPane className="TimelineScreen">
            <DualPane.ContentPane>
              <Timeline
                query={entitiesQuery}
                collection={timeline.collection}
                onStatusChange={this.onStatusChange}
              />
            </DualPane.ContentPane>
          </DualPane>
        </CollectionWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, match } = ownProps;
  const { entitySetId } = match.params;

  const timeline = selectEntitySet(state, entitySetId);

  return {
    entitySetId,
    timeline,
    entitiesQuery: entitySetEntitiesQuery(location, entitySetId, null, 1000),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet }),
)(TimelineScreen);
