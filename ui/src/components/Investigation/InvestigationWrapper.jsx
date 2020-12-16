import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import c from 'classnames';

import Query from 'app/Query';
import { selectEntitiesResult } from 'selectors';
import CollectionInfo from 'components/Collection/CollectionInfo';
import CollectionStatus from 'components/Collection/CollectionStatus';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionReference from 'components/Collection/CollectionReference';
import collectionViewIds from 'components/Collection/collectionViewIds';
import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import { Breadcrumbs, Collection, Count, Schema, DualPane, ResultText, ResultCount, Summary } from 'components/common';
import { queryCollectionEntities } from 'queries';
import CollectionWrapper from 'components/Collection/CollectionWrapper';

// const messages = defineMessages({
//   placeholder: {
//     id: 'collection.search.placeholder',
//     defaultMessage: 'Search this dataset',
//   },
//   placeholder_casefile: {
//     id: 'collection.search.placeholder',
//     defaultMessage: 'Search this personal dataset',
//   },
// });

import './InvestigationWrapper.scss';

const sidebarHiddenViews = [];

export class InvestigationWrapper extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { activeMode, children, collection } = this.props;

    const showSidebar = sidebarHiddenViews.indexOf(activeMode) < 0;

    return (
      <CollectionWrapper collection={collection} isCasefile>
        <DualPane className="InvestigationWrapper">
          {showSidebar && (
            <InvestigationSidebar
              collection={collection}
            />
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
    activeMode: hashQuery.mode
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  // injectIntl,
)(InvestigationWrapper);
