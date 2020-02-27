import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Prompt, withRouter } from 'react-router';
import queryString from 'query-string';
import { Intent } from '@blueprintjs/core';

import { fetchDiagram } from 'src/actions';
import { selectDiagram } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import DiagramManageMenu from 'src/components/Diagram/DiagramManageMenu';
import DiagramEditor from 'src/components/Diagram/DiagramEditor';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { Breadcrumbs, Collection, Diagram } from 'src/components/common';
import diagramUpdateStates from 'src/components/Diagram/diagramUpdateStates';

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
      {
        listItem: <Diagram.Label diagram={diagram} icon truncate={30} />,
        label: diagram.label,
        onSearch: this.onDiagramSearch,
        submitOnQueryChange: true,
      },
    ];

    return scopes;
  }

  fetchIfNeeded() {
    const { diagram, diagramId } = this.props;

    if (diagram.shouldLoad || diagram.shallow) {
      this.props.fetchDiagram(diagramId);
    }
  }

  formatStatus() {
    const { intl } = this.props;
    const { updateStatus } = this.state;

    switch (updateStatus) {
      case diagramUpdateStates.IN_PROGRESS:
        return { text: intl.formatMessage(messages.status_in_progress), intent: Intent.PRIMARY };
      case diagramUpdateStates.ERROR:
        return { text: intl.formatMessage(messages.status_error), intent: Intent.DANGER };
      default:
        return { text: intl.formatMessage(messages.status_success), intent: Intent.SUCCESS };
    }
  }

  render() {
    const { diagram, intl } = this.props;
    const { downloadTriggered, filterText, updateStatus } = this.state;

    if (diagram.isError) {
      return <ErrorScreen error={diagram.error} />;
    }

    if (!diagram.id || diagram.shallow) {
      return <LoadingScreen />;
    }

    const operation = (
      <DiagramManageMenu diagram={diagram} triggerDownload={this.onDiagramDownload} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation} status={this.formatStatus()}>
        <Breadcrumbs.Collection key="collection" collection={diagram.collection} />
        <Breadcrumbs.Text active>
          <Diagram.Label diagram={diagram} icon />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );

    return (
      <>
        <Prompt
          when={updateStatus === diagramUpdateStates.IN_PROGRESS}
          message={intl.formatMessage(messages.in_progress_warning)}
        />
        <Prompt
          when={updateStatus === diagramUpdateStates.ERROR}
          message={intl.formatMessage(messages.error_warning)}
        />
        <Screen
          title={diagram.label}
          description={diagram.summary || ''}
          searchScopes={this.getSearchScopes()}
        >
          {breadcrumbs}
          <DiagramEditor
            diagram={diagram}
            downloadTriggered={downloadTriggered}
            filterText={filterText}
            onStatusChange={this.onStatusChange}
            onDownloadComplete={this.onDownloadComplete}
          />
        </Screen>
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { diagramId } = ownProps.match.params;

  return {
    diagramId,
    diagram: selectDiagram(state, diagramId),
  };
};


export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, { fetchDiagram }),
)(DiagramScreen);
