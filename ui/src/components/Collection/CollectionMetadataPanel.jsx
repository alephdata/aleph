// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

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
