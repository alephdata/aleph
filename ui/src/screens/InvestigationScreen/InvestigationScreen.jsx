import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Redirect, withRouter } from 'react-router';

import Screen from 'components/Screen/Screen';
import { DualPane } from 'components/common';
import collectionViewIds from 'components/Collection/collectionViewIds';
import CollectionWrapper from 'components/Collection/CollectionWrapper';
import InvestigationViews from 'components/Investigation/InvestigationViews';
import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import ErrorScreen from 'components/Screen/ErrorScreen';
import { selectCollection } from 'selectors';

import './InvestigationScreen.scss';

const sidebarHiddenViews = [collectionViewIds.SEARCH, collectionViewIds.XREF];

export class InvestigationScreen extends Component {
  render() {
    const { collection, collectionId, activeMode, activeType } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    if (collection.casefile === false) {
      return <Redirect to={`/datasets/${collection.id}`} />;
    }

    const showSidebar = sidebarHiddenViews.indexOf(activeMode) < 0;
    return (
      <Screen
        title={collection.label}
        description={collection.summary}
      >
        <CollectionWrapper collectionId={collectionId} collection={collection} forceCasefile>
          <DualPane className="InvestigationScreen">
            {showSidebar && (
              <InvestigationSidebar
                collection={collection}
                activeMode={activeMode}
                activeType={activeType}
              />
            )}
            <DualPane.ContentPane className="InvestigationScreen__body">
              <div className="InvestigationScreen__body-content">
                <InvestigationViews
                  collection={collection}
                  activeMode={activeMode}
                  activeType={activeType}
                />
              </div>
            </DualPane.ContentPane>
          </DualPane>
        </CollectionWrapper>
      </Screen>
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
    collectionId,
    collection: selectCollection(state, collectionId),
    activeMode,
    activeType,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
)(InvestigationScreen);
