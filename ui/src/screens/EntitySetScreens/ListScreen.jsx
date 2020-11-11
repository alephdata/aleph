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
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { Breadcrumbs, Collection, EntitySet, DualPane, SchemaCounts } from 'components/common';


export class ListScreen extends Component {
  constructor(props) {
    super(props);
    this.onCollectionSearch = this.onCollectionSearch.bind(this);
    this.navigate = this.navigate.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  onCollectionSearch(queryText) {
    const { history, list } = this.props;
    const query = {
      q: queryText,
      'filter:collection_id': list.collection.id,
    };
    history.push({
      pathname: '/search',
      search: queryString.stringify(query),
    });
  }

  getSearchScopes() {
    const { list } = this.props;
    const scopes = [
      {
        listItem: <Collection.Label collection={list.collection} icon truncate={30} />,
        label: list.collection.label,
        onSearch: this.onCollectionSearch,
      },
    ];

    return scopes;
  }

  fetchIfNeeded() {
    const { list, countsResult, countsQuery, entitySetId } = this.props;

    if (list.shouldLoad || list.shallow) {
      this.props.fetchEntitySet(entitySetId);
    }
    if (countsResult.shouldLoad) {
      this.props.queryEntitySetEntities({ query: countsQuery });
    }
  }

  navigate(schema) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = schema;
    history.push({
      pathname: location.pathname,
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
    const { activeSchema, countsResult, list, querySchemaEntities } = this.props;

    if (list.isError) {
      return <ErrorScreen error={list.error} />;
    }

    if (!list.id || countsResult.total === undefined) {
      return <LoadingScreen />;
    }

    const operation = (
      <EntitySetManageMenu entitySet={list} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={list.collection} />
        <Breadcrumbs.Text active>
          <EntitySet.Label entitySet={list} icon />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );

    // isPending={countsResult.total === undefined && countsResult.isPending}


    return (
      <>
        <Screen
          title={list.label}
          description={list.summary || ''}
          searchScopes={list.collection.casefile ? [] : this.getSearchScopes()}
        >
          {breadcrumbs}
          <DualPane>
            <div>
              <SchemaCounts
                schemaCounts={this.processCounts()}
                onSelect={this.navigate}
                showSchemaAdd={list.writeable}
                activeSchema={activeSchema}
              />
            </div>
            <DualPane.ContentPane>
              <EntityTable
                query={querySchemaEntities(activeSchema)}
                collection={list.collection}
                schema={activeSchema}
                onStatusChange={() => { }}
                writeable={list.writeable}
                isEntitySet
              />
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      </>
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
  const querySchemaEntities = (schema) => entitySetEntitiesQuery(location, entitySetId, schema.name);
  const hashQuery = queryString.parse(location.hash);

  console.log(countsResult)

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
