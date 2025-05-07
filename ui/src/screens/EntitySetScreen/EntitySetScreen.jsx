import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';

import withRouter from '/src/app/withRouter.jsx';
import { fetchEntitySet } from '/src/actions/index.js';
import { selectEntitySet } from '/src/selectors.js';
import LoadingScreen from '/src/components/Screen/LoadingScreen.jsx';
import ErrorScreen from '/src/components/Screen/ErrorScreen.jsx';

export class EntitySetScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entitySet, entitySetId } = this.props;

    if (entitySet.shouldLoad) {
      this.props.fetchEntitySet({ id: entitySetId });
    }
  }

  render() {
    const { entitySet, entitySetId } = this.props;

    if (entitySet.isError) {
      return <ErrorScreen error={entitySet.error} />;
    }

    if (entitySet.id === undefined) {
      return <LoadingScreen />;
    }

    switch (entitySet.type) {
      case 'diagram':
        return <Navigate to={`/diagrams/${entitySetId}`} replace />;
      case 'list':
        return <Navigate to={`/lists/${entitySetId}`} replace />;
      case 'timeline':
        return <Navigate to={`/timelines/${entitySetId}`} replace />;
      case 'profile':
        return <Navigate to={`/profiles/${entitySetId}`} replace />;
      default:
        return <ErrorScreen error={entitySet.error} />;
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entitySetId } = ownProps.params;
  const entitySet = selectEntitySet(state, entitySetId);
  return { entitySet, entitySetId };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet })
)(EntitySetScreen);
