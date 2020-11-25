import React, { PureComponent } from 'react';
import { Summary } from 'components/common';
import CollectionInfo from 'components/Collection/CollectionInfo';
import CollectionStatus from 'components/Collection/CollectionStatus';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import CollectionReference from 'components/Collection/CollectionReference';

import './CollectionMetadataPanel.scss';

class CollectionMetadataPanel extends PureComponent {
  render() {
    const { collection } = this.props;
    if (!collection) {
      return null;
    }

    return (
      <div className="CollectionMetadataPanel">
        <div className="CollectionMetadataPanel__vertical-container">
          {collection.summary && (
            <div className="CollectionMetadataPanel__item">
              <Summary text={collection.summary} />
            </div>
          )}
          <CollectionStatus collection={collection} showCancel={collection.writeable} className="CollectionMetadataPanel__item" />
        </div>
        <div className="CollectionMetadataPanel__item">
          <CollectionInfo collection={collection} />
          <div className="CollectionMetadataPanel__actions">
            <CollectionManageMenu collection={collection} />
          </div>
        </div>
        <div className="CollectionMetadataPanel__item mobile-hide">
          <CollectionReference collection={collection} />
        </div>
      </div>
    );
  }
}

export default CollectionMetadataPanel;
