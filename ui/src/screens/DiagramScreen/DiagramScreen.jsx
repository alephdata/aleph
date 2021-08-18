import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';

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
import { Breadcrumbs, ErrorBoundary, SearchBox, UpdateStatus } from 'components/common';
import { showErrorToast } from 'app/toast';

const fileDownload = require('js-file-download');

const messages = defineMessages({
  export_error: {
    id: 'diagram.export.error',
    defaultMessage: 'Error exporting diagram',
  },
  render_error: {
    id: 'diagram.render.error',
    defaultMessage: 'Error rendering diagram',
  },
})

export class DiagramScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filterText: '',
      updateStatus: null,
    };

    this.onSearch = this.onSearch.bind(this);
    this.onStatusChange = this.onStatusChange.bind(this);
    this.editorRef = React.createRef();
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

  exportFtm = () => {
    const { entitiesResult, diagram } = this.props;
    const graphData = JSON.stringify({
      entities: entitiesResult.results?.map(e => e.toJSON()),
      layout: diagram.layout
    });
    fileDownload(graphData, `${diagram.label}.ftm`);
  }

  exportSvg = () => {
    const { intl } = this.props;
    if (!!this.editorRef?.exportSvg) {
      this.editorRef.exportSvg();
    } else {
      showErrorToast(
        intl.formatMessage(messages.export_error)
      );
    }
  }

  render() {
    const { diagram, entitiesResult, intl } = this.props;
    const { filterText, updateStatus } = this.state;

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
        exportFtm={this.exportFtm}
        exportSvg={this.exportSvg}
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
            <ErrorBoundary errorTitle={intl.formatMessage(messages.render_error)}>
              <DiagramEditor
                setRef={ref => this.editorRef = ref}
                collection={diagram.collection}
                onStatusChange={this.onStatusChange}
                diagram={diagram}
                entities={entitiesResult?.results}
                filterText={filterText}
              />
            </ErrorBoundary>
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
  injectIntl,
)(DiagramScreen);
