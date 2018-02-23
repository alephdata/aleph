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
import CollectionContent from './CollectionContent';
import CollectionInfo from './CollectionInfo';

const messages = defineMessages({
  not_found: {
    id: 'collection.not_found',
    defaultMessage: 'Collection not found',
  },
});

class CollectionScreen extends Component {
  componentDidMount() {
    const { collectionId } = this.props;
    this.props.fetchCollection({ id: collectionId });
  }

  componentDidUpdate(prevProps) {
    const { collectionId } = this.props;
    if (collectionId !== prevProps.collectionId) {
      this.props.fetchCollection({ id: collectionId });
    }
  }

  render() {
    const { collection, location, intl } = this.props;
    if (collection === undefined || collection.isFetching) {
      return <ScreenLoading />;
    }
    if (collection.error) {
      return (
        <NonIdealState visual="error" title={intl.formatMessage(messages.not_found)} />
      );
    }
    return (
      <Screen>
        <Helmet>
          <title>{collection.label}</title>
        </Helmet>
        <Breadcrumbs collection={collection} />
        <DualPane>
          <CollectionInfo collection={collection} location={location} />
          <CollectionContent collection={collection} />
        </DualPane>
      </Screen>
      
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const collection = state.collections[collectionId];
  return { collectionId, collection };
};

export default connect(mapStateToProps, { fetchCollection })(injectIntl(CollectionScreen));
