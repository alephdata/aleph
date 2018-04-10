import React, { Component } from 'react';
import { Helmet } from 'react-helmet';
import { injectIntl } from 'react-intl';

import { Screen, ScreenLoading, Breadcrumbs, DualPane, Collection } from 'src/components/common';
import { CollectionInfo, CollectionContent } from 'src/components/Collection';
import ErrorScreen from "../../components/ErrorMessages/ErrorScreen";

class CollectionScreen extends Component {
  render() {
    const { collection } = this.props;

    if (collection.error) {
      return (
          <ErrorScreen.NoTranslation title={collection.error}/>
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
