import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';

import { Collection } from 'src/components/common';
import CollectionStatus from 'src/components/Collection/CollectionStatus';

class CollectionHeading extends PureComponent {
  render() {
    const { collection } = this.props;
    return (
      <React.Fragment>
        <div className="pane-heading">
          <h1 itemProp="name">
            {collection.label}
          </h1>
          <span>
            <Collection.Label collection={collection} label={false} />
            { collection.casefile && (
              <FormattedMessage id="collection.info.case" defaultMessage="Casefile" />
            )}
            { !collection.casefile && (
              <FormattedMessage id="collection.info.source" defaultMessage="Source" />
            )}
          </span>
          <CollectionStatus collection={collection} />
        </div>
      </React.Fragment>
    );
  }
}

export default CollectionHeading;
