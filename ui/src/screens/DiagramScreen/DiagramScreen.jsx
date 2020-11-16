import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Prompt, withRouter } from 'react-router';
import queryString from 'query-string';
import { Intent } from '@blueprintjs/core';

import { fetchEntitySet, queryEntitySetEntities } from 'actions';
import { selectEntitySet, selectEntitiesResult } from 'selectors';
import { entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import DiagramEditor from 'components/Diagram/DiagramEditor';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { Breadcrumbs, Collection } from 'components/common';
import updateStates from 'util/updateStates';

const messages = defineMessages({
  status_success: {
    id: 'diagram.status_success',
    defaultMessage: 'Saved',
  },
  status_error: {
    id: 'diagram.status_error',
    defaultMessage: 'Error saving',
  },
  status_in_progress: {
    id: 'diagram.status_in_progress',
    defaultMessage: 'Saving...',
  },
  error_warning: {
    id: 'diagram.error_warning',
    defaultMessage: 'There was an error saving your latest changes, are you sure you want to leave?',
  },
  in_progress_warning: {
    id: 'diagram.in_progress_warning',
    defaultMessage: 'Changes are still being saved, are you sure you want to leave?',
  },
});

export class DiagramScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filterText: '',
      updateStatus: null,
      downloadTriggered: false,
    };

    this.onCollectionSearch = this.onCollectionSearch.bind(this);
    this.onDiagramSearch = this.onDiagramSearch.bind(this);
    this.onDiagramDownload = this.onDiagramDownload.bind(this);
    this.onDownloadComplete = this.onDownloadComplete.bind(this);
    this.onStatusChange = this.onStatusChange.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  onCollectionSearch(queryText) {
    const { history, diagram } = this.props;
    const query = {
      q: queryText,
      'filter:collection_id': diagram.collection.id,
    };
    history.push({
      pathname: '/search',
      search: queryString.stringify(query),
    });
  }

  onDiagramSearch(filterText) {
    this.setState({ filterText });
  }

  onDiagramDownload() {
    this.setState({ downloadTriggered: true });
  }

  onDownloadComplete() {
    this.setState({ downloadTriggered: false });
  }

  onStatusChange(updateStatus) {
    this.setState({ updateStatus });
  }

  getSearchScopes() {
    const { diagram } = this.props;
    const scopes = [
      {
        listItem: <Collection.Label collection={diagram.collection} icon truncate={30} />,
        label: diagram.collection.label,
        onSearch: this.onCollectionSearch,
      },
    ];

    return scopes;
  }

  fetchIfNeeded() {
    const { diagram, entitiesQuery, entitiesResult, entitySetId } = this.props;

    if (diagram.shouldLoad || diagram.shallow) {
      this.props.fetchEntitySet({ id: entitySetId });
    }

    if (entitiesResult.shouldLoad) {
      this.props.queryEntitySetEntities({ query: entitiesQuery });
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
    const { diagram, entitiesResult, intl } = this.props;
    const { downloadTriggered, filterText, updateStatus } = this.state;

    if (diagram.isError) {
      return <ErrorScreen error={diagram.error} />;
    }

    if (!diagram.id || diagram.shallow || entitiesResult.total === undefined) {
      return <LoadingScreen />;
    }

    const operation = (
      <EntitySetManageMenu entitySet={diagram} triggerDownload={this.onDiagramDownload} onSearch={this.onDiagramSearch} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation} status={this.formatStatus()}>
        <Breadcrumbs.Collection key="collection" collection={diagram.collection} />
        <Breadcrumbs.EntitySet key="diagram" entitySet={diagram} />
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
          title={diagram.label}
          description={diagram.summary || ''}
          searchScopes={this.getSearchScopes()}
        >
          {breadcrumbs}
          <DiagramEditor
            collection={diagram.collection}
            onStatusChange={this.onStatusChange}
            diagram={diagram}
            entities={entitiesResult?.results}
            downloadTriggered={downloadTriggered}
            filterText={filterText}
            onDownloadComplete={this.onDownloadComplete}
          />
        </Screen>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, match } = ownProps;
  const { entitySetId } = match.params;
  const entitiesQuery = entitySetEntitiesQuery(location, entitySetId, null, 1000);

  return {
    entitySetId,
    diagram: selectEntitySet(state, entitySetId),
    entitiesQuery,
    entitiesResult: selectEntitiesResult(state, entitiesQuery),
  };
};


export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { fetchEntitySet, queryEntitySetEntities }),
)(DiagramScreen);
