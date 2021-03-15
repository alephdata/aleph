import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { fetchEntitySet, queryEntitySetEntities } from 'actions';
import { selectEntitySet, selectEntitiesResult, selectModel } from 'selectors';
import { entitySetSchemaCountsQuery, entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntityTable from 'components/EntityTable/EntityTable';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import CollectionWrapper from 'components/Collection/CollectionWrapper';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { Breadcrumbs, DualPane, SchemaCounts } from 'components/common';

import './TimelineScreen.scss';

export class TimelineScreen extends Component {
  // constructor(props) {
  //   super(props);
  // }

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
    // if (countsResult.shouldLoad) {
    //   this.props.queryEntitySetEntities({ query: countsQuery });
    // }
  }

  // navigate(schema) {
  //   const { history, location } = this.props;
  //   const parsedHash = queryString.parse(location.hash);
  //   parsedHash.type = schema;
  //   history.push({
  //     pathname: location.pathname,
  //     search: "",
  //     hash: queryString.stringify(parsedHash),
  //   });
  // }

  render() {
    const { activeSchema, timeline, querySchemaEntities } = this.props;

    if (timeline.isError) {
      return <ErrorScreen error={timeline.error} />;
    }

    if (timeline.id === undefined) {
      return <LoadingScreen />;
    }

    const operation = (
      <EntitySetManageMenu entitySet={timeline} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
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

  const model = selectModel(state);
  const timeline = selectEntitySet(state, entitySetId);
  // const countsQuery = entitySetSchemaCountsQuery(entitySetId)
  // const countsResult = selectEntitiesResult(state, countsQuery);
  // const querySchemaEntities = (schema) => entitySetEntitiesQuery(location, entitySetId, schema.name, 30);
  const hashQuery = queryString.parse(location.hash);

  return {
    entitySetId,
    timeline,
    // countsQuery,
    // countsResult,
    // querySchemaEntities,
    activeSchema: model.getSchema(hashQuery.type || 'Person'),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet, queryEntitySetEntities }),
)(TimelineScreen);
