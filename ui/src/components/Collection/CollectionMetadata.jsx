import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import {
  Country, Role, Date, URL, Frequency,
} from 'components/common';

import './CollectionMetadata.scss';

class CollectionMetadata extends PureComponent {
  render() {
    const { collection } = this.props;
    if (!collection) {
      return null;
    }

    return (
      <div className="CollectionMetadata">
        <div className="CollectionMetadata__vertical-container">
          {collection.summary && (
            <div className="CollectionMetadata__item">
              <Summary text={collection.summary} />
            </div>
          )}
          <CollectionStatus collection={collection} showCancel={collection.writeable} className="CollectionMetadata__item" />
        </div>
        <div className="CollectionMetadata__item">
          <CollectionInfo collection={collection} />
          <div className="CollectionMetadata__actions">
            <CollectionManageMenu collection={collection} />
          </div>
        </div>
        <div className="CollectionMetadata__item mobile-hide">
          <CollectionReference collection={collection} />
        </div>
      </div>
    );
  }
}

export default CollectionMetadata;
