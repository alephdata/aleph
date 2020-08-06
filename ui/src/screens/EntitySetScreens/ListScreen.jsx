import React, { Component } from 'react';
import _ from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Prompt, withRouter } from 'react-router';
import queryString from 'query-string';
import { Intent } from '@blueprintjs/core';

import { fetchEntitySet, queryEntitySetEntities } from 'actions';
import { selectEntitySet, selectModel, selectEntitySetEntitiesResult } from 'selectors';
import { entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntityListViews from 'components/Entity/EntityListViews';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { Breadcrumbs, Collection, EntitySet, SinglePane } from 'components/common';
import updateStates from 'util/updateStates';

const messages = defineMessages({
  status_success: {
    id: 'list.status_success',
    defaultMessage: 'Saved',
  },
  status_error: {
    id: 'list.status_error',
    defaultMessage: 'Error saving',
  },
  status_in_progress: {
    id: 'list.status_in_progress',
    defaultMessage: 'Saving...',
  },
  error_warning: {
    id: 'list.error_warning',
    defaultMessage: 'There was an error saving your latest changes, are you sure you want to leave?',
  },
  in_progress_warning: {
    id: 'list.in_progress_warning',
    defaultMessage: 'Changes are still being saved, are you sure you want to leave?',
  },
});

export class ListScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {}
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

  onSearch(filterText) {
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

  render() {
    const { collection, countsResult, list, intl, querySchemaEntities } = this.props;
    const { filterText, updateStatus } = this.state;

    if (list.isError) {
      return <ErrorScreen error={list.error} />;
    }

    if (!list.id) {
      return <LoadingScreen />;
    }

    const operation = (
      <EntitySetManageMenu entitySet={list} onSearch={this.onDiagramSearch}/>
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={list.collection} />
        <Breadcrumbs.Text active>
          <EntitySet.Label entitySet={list} icon />
        </Breadcrumbs.Text>
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
            <h1 className="">
              {list.label}
            </h1>
            {list.summary && (
              <p className="">
                {list.summary}
              </p>
            )}
            <EntityListViews
              collection={list.collection}
              schemaCounts={countsResult?.facets?.schema?.values || []}
              querySchemaEntities={querySchemaEntities}
              writeable={list.writeable}
              isPending={countsResult.isPending}
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
  const countsQuery = entitySetEntitiesQuery(location, entitySetId)
    .add('facet', 'schema')
    .add('filter:schemata', 'Thing')
    .add('filter:schemata', 'Interval')
    .limit(0);

  const countsResult = selectEntitySetEntitiesResult(state, countsQuery);
  const querySchemaEntities = (schema) => (
    entitySetEntitiesQuery(location, entitySetId)
      .setFilter('schema', schema.name)
  );

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
  injectIntl,
  connect(mapStateToProps, { fetchEntitySet, queryEntitySetEntities }),
)(ListScreen);
