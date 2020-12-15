import React from 'react';
import CollectionMetadataPanel from 'components/Collection/CollectionMetadataPanel';

import './CollectionOverviewMode.scss';

const CollectionOverviewMode = ({ children, collection }) => {
  return (
    <div className="CollectionOverviewMode">
      <div className="CollectionOverviewMode__main">
        {children}
      </div>
      <div className="CollectionOverviewMode__secondary">
        <CollectionMetadataPanel collection={collection} />
      </div>
    </div>
  );
}

export default CollectionOverviewMode;
