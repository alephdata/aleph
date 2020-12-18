import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router';

import InvestigationViews from 'components/Investigation/InvestigationViews';
import InvestigationWrapper from 'components/Investigation/InvestigationWrapper';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { selectCollection } from 'selectors';

export class InvestigationScreen extends Component {
  render() {
    const { collection, activeMode, activeType } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (!collection.isPending) {
      const isCasefile = collection.casefile;
      if (!isCasefile) {
        return <Redirect to={`/datasets/${collection.id}`} />;
      }
    }

    return (
      <InvestigationWrapper collection={collection}>
        <InvestigationViews
          collection={collection}
          activeMode={activeMode}
          activeType={activeType}
          isPreview={false}
        />
      </InvestigationWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const activeMode = hashQuery.mode;
  const activeType = hashQuery.type;

  return {
    collection: selectCollection(state, collectionId),
    activeMode,
    activeType,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
)(InvestigationScreen);
