import React, { Component } from 'react';
import { injectIntl } from 'react-intl';

import { Screen, ScreenLoading, Breadcrumbs, DualPane, Collection, ErrorScreen } from 'src/components/common';
import { CollectionInfo, CollectionContent } from 'src/components/Collection';

class CollectionScreen extends Component {
  render() {
    const { collection } = this.props;
    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    return (
      <Screen title={collection.label} breadcrumbs={<Breadcrumbs collection={collection} />}>
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
