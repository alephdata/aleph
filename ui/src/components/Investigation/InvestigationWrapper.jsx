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
import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import { Breadcrumbs, Collection, Count, Schema, DualPane, ResultText, ResultCount, Summary } from 'components/common';
import { queryCollectionEntities } from 'queries';

// import Screen from 'components/Screen/Screen';
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

export class InvestigationWrapper extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { children, collection } = this.props;
    return (
      <CollectionWrapper collection={collection}>
        <DualPane className="InvestigationWrapper">
          <div className="InvestigationWrapper__sidebar-container">
            <InvestigationSidebar
              collection={collection}
            />
          </div>
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

// const mapStateToProps = (state, ownProps) => {
//   const { collectionId } = ownProps.match.params;
//   const { collection, location } = ownProps;
//   const hashQuery = queryString.parse(location.hash);
//   const activeMode = hashQuery.mode || collectionViewIds.OVERVIEW;
//   const query = queryCollectionEntities(activeMode === 'search' && location, collectionId);
//
//   return {
//     collectionId,
//     query,
//     status: selectCollectionStatus(state, collectionId),
//   };
// };


export default compose(
  // withRouter,
  // connect(mapStateToProps),
  // injectIntl,
)(InvestigationWrapper);
