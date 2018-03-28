import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { defineMessages, injectIntl } from 'react-intl';

import Screen from 'src/components/common/Screen';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import CollectionContent from './CollectionContent';
import CollectionInfo from './CollectionInfo';
import Collection from 'src/components/common/Collection';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';

const messages = defineMessages({
  not_found: {
    id: 'collection.not_found',
    defaultMessage: 'Source not found',
  },
  not_authorized: {
    id: 'collection.not_auth',
    defaultMessage: 'You are not authorized to do this.',
  },
  not_authorized_decr: {
    id: 'collection.not_auth_decr',
    defaultMessage: 'Please go to the login page.',
  }
});

class CollectionScreen extends Component {
  render() {
    const { collection } = this.props;

    if(collection.status === 403) {
      return (
        <ErrorScreen.LinkDescription isPage={true} title={messages.not_authorized} description={messages.not_authorized_decr}/>
      )
    } else if (collection.error) {
      return (
        <ErrorScreen.PageNotFound title={messages.not_found}/>
      )
    }

    return (
      <Screen breadcrumbs={<Breadcrumbs collection={collection} />}>
        <Helmet>
          <title>{collection.label}</title>
        </Helmet>
        <DualPane>
          <CollectionInfo collection={collection} />
          <CollectionContent collection={collection} />
        </DualPane>
      </Screen>
    );
  }
}

CollectionScreen = injectIntl(CollectionScreen);

// Wrap the CollectionScreen into Collection.Load to handle data fetching.
export default ({ match, ...otherProps }) => (
  <Collection.Load
    id={match.params.collectionId}
    renderWhenLoading={<ScreenLoading />}
  >{collection => (
    <CollectionScreen collection={collection} {...otherProps} />
  )}</Collection.Load>
);
