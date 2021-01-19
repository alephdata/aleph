import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchEntitySet, queryEntitySetEntities } from 'actions';
import { selectEntitySet, selectEntitiesResult } from 'selectors';
import { entitySetEntitiesQuery } from 'queries';
import Screen from 'components/Screen/Screen';
import EntitySetManageMenu from 'components/EntitySet/EntitySetManageMenu';
import DiagramEditor from 'components/Diagram/DiagramEditor';
import CollectionWrapper from 'components/Collection/CollectionWrapper';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionView from 'components/Collection/CollectionView';
import { Breadcrumbs, SearchBox, UpdateStatus } from 'components/common';


export class DiagramScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filterText: '',
      updateStatus: null,
      downloadTriggered: false,
    };

    this.onSearch = this.onSearch.bind(this);
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

  onSearch(filterText) {
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

  fetchIfNeeded() {
    const { diagram, entitiesQuery, entitiesResult, entitySetId } = this.props;
    if (diagram.shouldLoadDeep) {
      this.props.fetchEntitySet({ id: entitySetId });
    }

    if (entitiesResult.shouldLoad) {
      this.props.queryEntitySetEntities({ query: entitiesQuery });
    }
  }

  render() {
    const { diagram, entitiesResult } = this.props;
    const { downloadTriggered, filterText, updateStatus } = this.state;

    if (diagram.isError) {
      return <ErrorScreen error={diagram.error} />;
    }

    if (!diagram.id || diagram.shallow || entitiesResult.total === undefined) {
      return <LoadingScreen />;
    }

    const search = (
      <SearchBox
        onSearch={this.onSearch}
        placeholderLabel={diagram.label}
      />
    );

    const status = <UpdateStatus status={updateStatus} />;

    const operation = (
      <EntitySetManageMenu entitySet={diagram} triggerDownload={this.onDiagramDownload} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation} search={search} status={status}>
        <Breadcrumbs.Text>
          <CollectionView.Link id={collectionViewIds.DIAGRAMS} collection={diagram.collection} icon />
        </Breadcrumbs.Text>
        <Breadcrumbs.EntitySet key="diagram" entitySet={diagram} icon={false}/>
      </Breadcrumbs>
    );

    return (
      <>
        <Screen
          title={diagram.label}
          description={diagram.summary || ''}
        >
          <CollectionWrapper collection={diagram.collection}>
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
          </CollectionWrapper>
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
  connect(mapStateToProps, { fetchEntitySet, queryEntitySetEntities }),
)(DiagramScreen);
