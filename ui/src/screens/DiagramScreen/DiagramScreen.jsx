import React, { Component } from 'react';
// import { FormattedMessage } from 'react-intl';
// import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchDiagram } from 'src/actions';
import { selectDiagram } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import DiagramManageMenu from 'src/components/Diagram/DiagramManageMenu';
import DiagramEditor from 'src/components/Diagram/DiagramEditor';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { Breadcrumbs, Diagram } from 'src/components/common';


export class DiagramScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { diagram, diagramId } = this.props;

    console.log('diagram id', diagramId);

    if (diagram.shouldLoad) {
      this.props.fetchDiagram(diagramId);
    }
  }

  render() {
    const { diagram } = this.props;

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
      <Breadcrumbs operation={operation}>
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
        searchScopes={[]}
      >
        {breadcrumbs}
        <DiagramEditor />
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { diagramId } = ownProps.match.params;


  console.log(state, diagramId, selectDiagram(state, diagramId));

  return {
    diagramId,
    diagram: selectDiagram(state, diagramId),
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps, { fetchDiagram }),
)(DiagramScreen);
