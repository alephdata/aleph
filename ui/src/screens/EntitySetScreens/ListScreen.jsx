import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Prompt, withRouter } from 'react-router';
import queryString from 'query-string';
import { Intent } from '@blueprintjs/core';

import { fetchEntitySet } from 'actions';
import { selectEntitySet } from 'selectors';
import Screen from 'components/Screen/Screen';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { Breadcrumbs, Collection, EntitySet } from 'components/common';
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
    this.onDiagramSearch = this.onDiagramSearch.bind(this);
    this.onDiagramDownload = this.onDiagramDownload.bind(this);
    this.onDownloadComplete = this.onDownloadComplete.bind(this);
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
    const { list, intl } = this.props;
    const { downloadTriggered, filterText, updateStatus } = this.state;

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
        </Screen>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { listId } = ownProps.match.params;

  return {
    listId,
    list: selectEntitySet(state, listId),
  };
};


export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { fetchEntitySet }),
)(ListScreen);
