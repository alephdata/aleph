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

const fileDownload = require('js-file-download');


export class DiagramScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filterText: '',
      updateStatus: null,
    };

    this.onSearch = this.onSearch.bind(this);
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

  downloadDiagram = () => {
    const { entitiesResult, diagram } = this.props;
    const graphData = JSON.stringify({
      entities: entitiesResult.results?.map(e => e.toJSON()),
      layout: diagram.layout
    });
    fileDownload(graphData, `${diagram.label}.ftm`);
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
      <EntitySetManageMenu
        entitySet={diagram}
        triggerDownload={this.downloadDiagram}
      />
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
              filterText={filterText}
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
