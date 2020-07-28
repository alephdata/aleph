import React, { Component } from 'react';
import _ from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Prompt, withRouter } from 'react-router';
import queryString from 'query-string';
import { Intent } from '@blueprintjs/core';

import { fetchEntitySet } from 'actions';
import { selectEntitySet, selectModel } from 'selectors';
import { queryEntitySetEntities } from 'queries';
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

    this.state = {
      updateStatus: null,
    };

    this.onCollectionSearch = this.onCollectionSearch.bind(this);
    this.onStatusChange = this.onStatusChange.bind(this);
  }

  componentDidMount() {
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
    console.log('searching');
  }

  onStatusChange(updateStatus) {
    this.setState({ updateStatus });
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
    const { list, listId } = this.props;

    if (list.shouldLoad || list.shallow) {
      this.props.fetchEntitySet(listId);
    }
  }

  formatStatus() {
    const { intl } = this.props;
    const { updateStatus } = this.state;

    switch (updateStatus) {
      case updateStates.IN_PROGRESS:
        return { text: intl.formatMessage(messages.status_in_progress), intent: Intent.PRIMARY };
      case updateStates.ERROR:
        return { text: intl.formatMessage(messages.status_error), intent: Intent.DANGER };
      default:
        return { text: intl.formatMessage(messages.status_success), intent: Intent.SUCCESS };
    }
  }

  render() {
    const { collection, list, intl, activeType, activeSchema, query, selectableSchemata, schemaViews } = this.props;
    const { downloadTriggered, filterText, updateStatus } = this.state;

    console.log('list', list);

    if (list.isError) {
      return <ErrorScreen error={list.error} />;
    }

    if ((!list.id) || list.shallow) {
      return <LoadingScreen />;
    }

    const operation = (
      <EntitySetManageMenu entitySet={list} onSearch={this.onDiagramSearch}/>
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation} status={this.formatStatus()}>
        <Breadcrumbs.Collection key="collection" collection={list.collection} />
        <Breadcrumbs.Text active>
          <EntitySet.Label entitySet={list} icon />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );

    return (
      <>
        <Prompt
          when={updateStatus === updateStates.IN_PROGRESS}
          message={intl.formatMessage(messages.in_progress_warning)}
        />
        <Prompt
          when={updateStatus === updateStates.ERROR}
          message={intl.formatMessage(messages.error_warning)}
        />
        <Screen
          title={list.label}
          description={list.summary || ''}
          searchScopes={this.getSearchScopes()}
        >
          {breadcrumbs}
          <SinglePane>
            <EntityListViews
              activeType={activeType}
              activeSchema={activeSchema}
              collection={list.collection}
              selectableSchemata={selectableSchemata}
              schemaViews={schemaViews}
              query={query}
            />
          </SinglePane>
        </Screen>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, match } = ownProps;
  const { listId } = match.params;

  const list = selectEntitySet(state, listId);

  if (!list.isPending) {
    const hashQuery = queryString.parse(location.hash);
    const hashType = hashQuery.type;
    const model = selectModel(state);
    const schemata = model.getSchemata()
      .filter((schema) => !schema.isDocument() && !schema.isA('Page'))
      .map((schema) => schema.name);

    const schemaCounts = _.groupBy(list.entities, 'schema');

    console.log(schemaCounts)
    const matching = [];
    for (const key in schemaCounts) {
      if (schemata.indexOf(key) !== -1) {
        matching.push({
          schema: key,
          count: schemaCounts[key].length,
        });
      }
    }

    const schemaViews = _.reverse(_.sortBy(matching, ['count']));
    console.log(schemaViews)
    if (hashType && !schemaCounts.hasOwnProperty(hashType)) {
      schemaViews.push({ schema: hashType, count: 0 });
    }
    if (!schemaViews.length) {
      schemaViews.push({ schema: 'Person', count: 0 });
    }

    const activeType = hashType || schemaViews[0].schema;
    const selectableSchemata = schemata
      .filter((s) => !schemaViews.find((v) => v.schema === s));

    return {
      list,
      listId,
      activeType,
      activeSchema: model.getSchema(activeType),
      schemaViews,
      selectableSchemata,
      query: queryEntitySetEntities(location, listId, activeType),
    };
  }

  return {
    listId,
    list,
  };
};


export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { fetchEntitySet }),
)(ListScreen);
