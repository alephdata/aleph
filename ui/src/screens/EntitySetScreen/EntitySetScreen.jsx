import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter, Redirect } from 'react-router';

import { fetchEntitySet } from 'actions';
import { selectEntitySet } from 'selectors';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';

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

    switch(entitySet.type) {
      case 'diagram':
        return <Redirect to={`/diagrams/${entitySetId}`} />;
      case 'list':
        return <Redirect to={`/lists/${entitySetId}`} />;
      case 'timeline':
        return <Redirect to={`/timelines/${entitySetId}`} />;
      case 'profile':
        return <Redirect to={`/profiles/${entitySetId}`} />;
      default:
        return <ErrorScreen error={entitySet.error} />;
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entitySetId } = ownProps.match.params;
  const entitySet = selectEntitySet(state, entitySetId);
  return { entitySet, entitySetId };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { fetchEntitySet }),
)(EntitySetScreen);
