import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';

import withRouter from 'app/withRouter'
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

import './ListScreen.scss';

export class ListScreen extends Component {
  constructor(props) {
    super(props);
    this.navigate = this.navigate.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { list, countsResult, countsQuery, entitySetId } = this.props;

    if (list.shouldLoad) {
      this.props.fetchEntitySet({ id: entitySetId });
    }
    if (countsResult.shouldLoad) {
      this.props.queryEntitySetEntities({ query: countsQuery });
    }
  }

  navigate(schema) {
    const { navigate, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = schema;
    navigate({
      pathname: location.pathname,
      search: "",
      hash: queryString.stringify(parsedHash),
    });
  }

  processCounts = () => {
    const { countsResult } = this.props;
    if (!countsResult?.facets?.schema?.values) {
      return {};
    }

    const counts = {};
    countsResult.facets.schema.values.forEach(({ id, count }) => {
      counts[id] = count;
    });
    return counts;
  }

  render() {
    const { activeSchema, list, querySchemaEntities } = this.props;

    if (list.isError) {
      return <ErrorScreen error={list.error} />;
    }

    if (list.id === undefined) {
      return <LoadingScreen />;
    }

    const operation = (
      <EntitySetManageMenu entitySet={list} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Text>
          <CollectionView.Link id={collectionViewIds.LISTS} collection={list.collection} icon />
        </Breadcrumbs.Text>
        <Breadcrumbs.EntitySet key="list" entitySet={list} icon={false}/>
      </Breadcrumbs>
    );

    return (
      <Screen
        title={list.label}
        description={list.summary || ''}
      >
        <CollectionWrapper collection={list.collection}>
          {breadcrumbs}
          <DualPane className="ListScreen">
            <div className="ListScreen__schema-counts">
              <SchemaCounts
                schemaCounts={this.processCounts()}
                onSelect={this.navigate}
                showSchemaAdd={list.writeable}
                activeSchema={activeSchema.name}
              />
            </div>
            <DualPane.ContentPane>
              <EntityTable
                query={querySchemaEntities(activeSchema)}
                collection={list.collection}
                schema={activeSchema}
                writeable={list.writeable}
                isEntitySet
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

  const model = selectModel(state);
  const list = selectEntitySet(state, entitySetId);
  const countsQuery = entitySetSchemaCountsQuery(entitySetId)
  const countsResult = selectEntitiesResult(state, countsQuery);
  const querySchemaEntities = (schema) => entitySetEntitiesQuery(location, entitySetId, schema.name, 30);
  const hashQuery = queryString.parse(location.hash);

  return {
    entitySetId,
    list,
    countsQuery,
    countsResult,
    querySchemaEntities,
    activeSchema: model.getSchema(hashQuery.type || 'Person'),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet, queryEntitySetEntities }),
)(ListScreen);
