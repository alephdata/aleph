import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Prompt, withRouter } from 'react-router';
import queryString from 'query-string';
import { Divider, Intent } from '@blueprintjs/core';

import { fetchEntitySet, queryEntitySetEntities } from 'actions';
import { selectEntitySet, selectEntitiesResult } from 'selectors';
import { entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import DiagramEditor from 'components/Diagram/DiagramEditor';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { Breadcrumbs, Collection, EntitySet, UpdateStatus } from 'components/common';


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
      <>
        {updateStatus && (
          <>
            <UpdateStatus status={updateStatus} />
            <Divider />
          </>
        )}
        <EntitySetManageMenu entitySet={diagram} triggerDownload={this.onDiagramDownload} onSearch={this.onDiagramSearch}/>
      </>
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={diagram.collection} />
        <Breadcrumbs.Text active>
          <EntitySet.Label entitySet={diagram} icon />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );

    return (
      <>
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
