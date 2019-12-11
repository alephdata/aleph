import React, { Component } from 'react';
// import { FormattedMessage } from 'react-intl';
// import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import { fetchDiagram } from 'src/actions';
import { selectDiagram } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import DiagramManageMenu from 'src/components/Diagram/DiagramManageMenu';
import DiagramEditor from 'src/components/Diagram/DiagramEditor';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { Breadcrumbs, Collection, Diagram } from 'src/components/common';


export class DiagramScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filterText: '',
      updateStatus: null,
    };

    this.onCollectionSearch = this.onCollectionSearch.bind(this);
    this.onDiagramSearch = this.onDiagramSearch.bind(this);
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

  onStatusChange(updateStatus) {
    console.log(updateStatus);
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
      },
    ];

    return scopes;
  }

  fetchIfNeeded() {
    const { diagram, diagramId } = this.props;

    if (diagram.shouldLoad) {
      this.props.fetchDiagram(diagramId);
    }
  }

  render() {
    const { diagram } = this.props;
    const { filterText, updateStatus } = this.state;

    if (diagram.isError) {
      return <ErrorScreen error={diagram.error} />;
    }

    if (!diagram.id) {
      return <LoadingScreen />;
    }

    const operation = (
      <DiagramManageMenu diagram={diagram} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation} status={updateStatus}>
        <Breadcrumbs.Collection key="collection" collection={diagram.collection} />
        <Breadcrumbs.Text active>
          <Diagram.Label diagram={diagram} />
        </Breadcrumbs.Text>
      </Breadcrumbs>
    );
    return (
      <Screen
        title="placeholder"
        description="placeholder"
        searchScopes={this.getSearchScopes()}
      >
        {breadcrumbs}
        <DiagramEditor
          diagram={diagram}
          filterText={filterText}
          onStatusChange={this.onStatusChange}
        />
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { diagramId } = ownProps.match.params;

  console.log(state);

  return {
    diagramId,
    diagram: selectDiagram(state, diagramId),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchDiagram }),
)(DiagramScreen);
