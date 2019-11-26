import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Collection } from 'src/components/common';
import CollectionStatus from 'src/components/Collection/CollectionStatus';

import './CollectionHeading.scss';
import 'src/components/common/ItemOverview.scss';


class CollectionHeading extends PureComponent {
  render() {
    const { collection } = this.props;
    return (
      <>
        <span className="bp3-text-muted ItemOverview__heading__subtitle">
          <Collection.Label collection={collection} label={false} />
          { collection.casefile && (
            <FormattedMessage id="collection.info.case" defaultMessage="Personal dataset" />
          )}
          { !collection.casefile && (
            <FormattedMessage id="collection.info.collection" defaultMessage="Dataset" />
          )}
        </span>
        <h1 itemProp="name" className="ItemOverview__heading__title">
          {collection.label}
        </h1>
        <CollectionStatus collection={collection} showCancel />
        {collection.summary && (
          <div className="ItemOverview__heading__description">
            <Collection.Summary collection={collection} />
          </div>
        )}
      </>
    );
  }
}

export default CollectionHeading;
