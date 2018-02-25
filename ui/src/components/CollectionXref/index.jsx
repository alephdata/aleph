import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { NonIdealState } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';

import { fetchCollection } from 'src/actions';
import Screen from 'src/components/common/Screen';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';

import './CollectionXrefScreen.css';


class CollectionXrefScreen extends Component {
  componentDidMount() {
    const { collectionId, otherId } = this.props;
    this.props.fetchCollection({ id: collectionId });
    this.props.fetchCollection({ id: otherId });
  }

  componentDidUpdate(prevProps) {
    const { collectionId, otherId } = this.props;
    if (collectionId !== prevProps.collectionId) {
      this.props.fetchCollection({ id: collectionId });
      this.props.fetchCollection({ id: otherId });
    }
  }

  render() {
    const { collection, other, location } = this.props;
    const loading = collection === undefined || collection.isFetching || other === undefined || other.isFetching;
    if (loading) {
      return <ScreenLoading />;
    }
    
    return (
      <Screen>
        <Helmet>
          <title>{collection.label}</title>
        </Helmet>
        <Breadcrumbs collection={collection} />
        <table className="CollectionXrefScreen pt-html-table">
          <thead>
            <tr>
              <th></th>
              <th>
                {collection.label}
              </th>
              <th>
                {other.label}
              </th>
            </tr>
          </thead>
        </table>
      </Screen>
      
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, otherId } = ownProps.match.params;
  const collection = state.collections[collectionId];
  const other = state.collections[otherId];
  return { collectionId, otherId, collection, other };
};

CollectionXrefScreen = injectIntl(CollectionXrefScreen);
export default connect(mapStateToProps, { fetchCollection })(CollectionXrefScreen);
