import React, { Component } from 'react';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import collectionViewIds from 'components/Collection/collectionViewIds';
import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import { DualPane } from 'components/common';
import CollectionWrapper from 'components/Collection/CollectionWrapper';


import './InvestigationWrapper.scss';

const sidebarHiddenViews = [collectionViewIds.SEARCH];

export class InvestigationWrapper extends Component {
  render() {
    const { children, collection, showSidebar } = this.props;

    return (
      <CollectionWrapper collection={collection} forceCasefile>
        <DualPane className="InvestigationWrapper">
          {showSidebar && (
            <InvestigationSidebar collection={collection} />
          )}
          <DualPane.ContentPane className="InvestigationWrapper__body">
            <div className="InvestigationWrapper__body-content">
              {children}
            </div>
          </DualPane.ContentPane>
        </DualPane>
      </CollectionWrapper>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const activeMode = hashQuery.mode;

  return {
    showSidebar: sidebarHiddenViews.indexOf(activeMode) < 0
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
)(InvestigationWrapper);
