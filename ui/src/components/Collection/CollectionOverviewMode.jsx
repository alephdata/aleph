import React from 'react';
import CollectionMetadataPanel from 'components/Collection/CollectionMetadataPanel';
import CollectionOverview from 'components/Collection/CollectionOverview';
import InvestigationOverview from 'components/Investigation/InvestigationOverview';

import './CollectionOverviewMode.scss';

const CollectionOverviewMode = ({ children, collection, isCasefile }) => {
  return (
    <div className="CollectionOverviewMode">
      <div className="CollectionOverviewMode__main">
        {isCasefile && <InvestigationOverview collection={collection} />}
        {!isCasefile && <CollectionOverview collection={collection} />}
      </div>
      <div className="CollectionOverviewMode__secondary">
        <CollectionMetadataPanel collection={collection} />
      </div>
    </div>
  );
}

export default CollectionOverviewMode;
