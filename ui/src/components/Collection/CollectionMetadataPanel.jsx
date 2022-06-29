{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { PureComponent } from 'react';
import { Skeleton, Summary } from 'components/common';
import CollectionInfo from 'components/Collection/CollectionInfo';
import CollectionStatus from 'components/Collection/CollectionStatus';
import CollectionReference from 'components/Collection/CollectionReference';

import './CollectionMetadataPanel.scss';

class CollectionMetadataPanel extends PureComponent {
  renderSkeleton() {
    return (
      <div className="CollectionMetadataPanel">
        <Skeleton.Text type="div" length="75" className="CollectionMetadataPanel__item" />
        <Skeleton.Text type="div" length="100" className="CollectionMetadataPanel__item" />
        <Skeleton.Text type="div" length="200" className="CollectionMetadataPanel__item" />
      </div>
    );
  }

  render() {
    const { collection } = this.props;
    if (!collection?.id) {
      return this.renderSkeleton();
    }

    return (
      <div className="CollectionMetadataPanel">
        <CollectionStatus collection={collection} showCancel={collection.writeable} className="CollectionMetadataPanel__item" />
        {collection.summary && (
          <div className="CollectionMetadataPanel__item">
            <Summary text={collection.summary} />
          </div>
        )}
        <div className="CollectionMetadataPanel__item">
          <CollectionInfo collection={collection} />
        </div>
        <div className="CollectionMetadataPanel__item mobile-hide">
          <CollectionReference collection={collection} />
        </div>
      </div>
    );
  }
}

export default CollectionMetadataPanel;
