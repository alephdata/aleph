import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { fetchEntitySet, queryEntitySetEntities } from 'actions';
import { selectEntitySet, selectEntitiesResult } from 'selectors';
import { entitySetSchemaCountsQuery, entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntityTableViews from 'components/EntityTable/EntityTableViews';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { Breadcrumbs, Collection, SinglePane } from 'components/common';


export class ListScreen extends Component {
  constructor(props) {
    super(props);
    this.onCollectionSearch = this.onCollectionSearch.bind(this);
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
      this.props.fetchEntitySet({ id: entitySetId });
    }
    if (countsResult.shouldLoad) {
      this.props.queryEntitySetEntities({ query: countsQuery });
    }
  }

  render() {
    const { countsResult, list, querySchemaEntities } = this.props;

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
        <Breadcrumbs.EntitySet key="list" entitySet={list} />
      </Breadcrumbs>
    );

    return (
      <>
        <Screen
          title={list.label}
          description={list.summary || ''}
          searchScopes={this.getSearchScopes()}
        >
          {breadcrumbs}
          <SinglePane>
            <EntityTableViews
              collection={list.collection}
              schemaCounts={countsResult?.facets?.schema?.values || []}
              querySchemaEntities={querySchemaEntities}
              writeable={list.writeable}
              isPending={countsResult.total === undefined && countsResult.isPending}
              isEntitySet
            />
          </SinglePane>
        </Screen>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, match } = ownProps;
  const { entitySetId } = match.params;

  const list = selectEntitySet(state, entitySetId);
  const countsQuery = entitySetSchemaCountsQuery(entitySetId)
  const countsResult = selectEntitiesResult(state, countsQuery);
  const querySchemaEntities = (schema) => entitySetEntitiesQuery(location, entitySetId, schema.name, 30);

  return {
    entitySetId,
    list,
    countsQuery,
    countsResult,
    querySchemaEntities
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet, queryEntitySetEntities }),
)(ListScreen);
