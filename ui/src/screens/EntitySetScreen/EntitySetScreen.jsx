import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Prompt, withRouter } from 'react-router';
import queryString from 'query-string';
import { Intent } from '@blueprintjs/core';

import { fetchEntitySet } from 'src/actions';
import { selectEntitySet } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import EntitySetManageMenu from 'src/components/EntitySet/EntitySetManageMenu';
import DiagramEditor from 'src/components/Diagram/DiagramEditor';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { Breadcrumbs, Collection, EntitySet } from 'src/components/common';
import updateStates from 'src/util/updateStates';

const messages = defineMessages({
  status_success: {
    id: 'entityset.status_success',
    defaultMessage: 'Saved',
  },
  status_error: {
    id: 'entityset.status_error',
    defaultMessage: 'Error saving',
  },
  status_in_progress: {
    id: 'entityset.status_in_progress',
    defaultMessage: 'Saving...',
  },
  error_warning: {
    id: 'entityset.error_warning',
    defaultMessage: 'There was an error saving your latest changes, are you sure you want to leave?',
  },
  in_progress_warning: {
    id: 'entityset.in_progress_warning',
    defaultMessage: 'Changes are still being saved, are you sure you want to leave?',
  },
});

export class EntitySetScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filterText: '',
      updateStatus: null,
      downloadTriggered: false,
    };

    this.onCollectionSearch = this.onCollectionSearch.bind(this);
    this.onEntitySetSearch = this.onEntitySetSearch.bind(this);
    this.onEntitySetDownload = this.onEntitySetDownload.bind(this);
    this.onDownloadComplete = this.onDownloadComplete.bind(this);
    this.onStatusChange = this.onStatusChange.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  onCollectionSearch(queryText) {
    const { history, entitySet } = this.props;
    const query = {
      q: queryText,
      'filter:collection_id': entitySet.collection.id,
    };
    history.push({
      pathname: '/search',
      search: queryString.stringify(query),
    });
  }

  onEntitySetSearch(filterText) {
    this.setState({ filterText });
  }

  onEntitySetDownload() {
    this.setState({ downloadTriggered: true });
  }

  onDownloadComplete() {
    this.setState({ downloadTriggered: false });
  }

  onStatusChange(updateStatus) {
    this.setState({ updateStatus });
  }

  getSearchScopes() {
    const { entitySet } = this.props;
    const scopes = [
      {
        listItem: <Collection.Label collection={entitySet.collection} icon truncate={30} />,
        label: entitySet.collection.label,
        onSearch: this.onCollectionSearch,
      },
      {
        listItem: <EntitySet.Label entitySet={entitySet} icon truncate={30} />,
        label: entitySet.label,
        onSearch: this.onEntitySetSearch,
        submitOnQueryChange: true,
      },
    ];

    return scopes;
  }

  fetchIfNeeded() {
    const { entitySet, entitySetId } = this.props;

    if (entitySet.shouldLoad || entitySet.shallow) {
      this.props.fetchEntitySet(entitySetId);
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
    const { entitySet, intl } = this.props;
    const { type } = entitySet;
    const { downloadTriggered, filterText, updateStatus } = this.state;

    if (entitySet.isError) {
      return <ErrorScreen error={entitySet.error} />;
    }

    if ((!entitySet.id) || entitySet.shallow) {
      return <LoadingScreen />;
    }

    const operation = (
      <EntitySetManageMenu entitySet={entitySet} triggerDownload={this.onEntitySetDownload} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation} status={this.formatStatus()}>
        <Breadcrumbs.Collection key="collection" collection={entitySet.collection} />
        <Breadcrumbs.Text active>
          <EntitySet.Label entitySet={entitySet} icon />
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
          title={entitySet.label}
          description={entitySet.summary || ''}
          searchScopes={this.getSearchScopes()}
        >
          {breadcrumbs}
          {type === 'diagram' && (
            <DiagramEditor
              collection={entitySet.collection}
              onStatusChange={this.onStatusChange}
              diagram={entitySet}
              downloadTriggered={downloadTriggered}
              filterText={filterText}
              onDownloadComplete={this.onDownloadComplete}
            />
          )}
          {type === 'timeline' && (
            <div>{ type }: { entitySet.label }</div>
          )}
          {type === 'generic' && (
            <div>{ type }: { entitySet.label }</div>
          )}
        </Screen>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entitySetId } = ownProps.match.params;

  return {
    entitySetId,
    entitySet: selectEntitySet(state, entitySetId),
  };
};


export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { fetchEntitySet }),
)(EntitySetScreen);
