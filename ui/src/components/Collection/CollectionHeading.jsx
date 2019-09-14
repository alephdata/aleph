import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { Collection } from 'src/components/common';
import CollectionStatus from 'src/components/Collection/CollectionStatus';
import { Toolbar, CollectionManageButton } from 'src/components/Toolbar';

class CollectionHeading extends PureComponent {
  render() {
    const { collection } = this.props;
    return (
      <React.Fragment>
        <Toolbar className="toolbar-preview">
          <div className="bp3-button-group">
            <Link to={`/search?filter:collection_id=${collection.id}`} className="bp3-button button-link">
              <span className="bp3-icon-search" />
              <FormattedMessage id="collection.info.search_button" defaultMessage="Search" />
            </Link>
            <CollectionManageButton collection={collection} />
          </div>
        </Toolbar>
        <div className="pane-heading">
          <span>
            <Collection.Label collection={collection} label={false} />
            { collection.casefile && (
              <FormattedMessage id="collection.info.case" defaultMessage="Casefile" />
            )}
            { !collection.casefile && (
              <FormattedMessage id="collection.info.source" defaultMessage="Source" />
            )}
          </span>
          <h1 itemProp="name">
            {collection.label}
          </h1>
          <CollectionStatus collection={collection} />
        </div>
      </React.Fragment>
    );
  }
}

export default CollectionHeading;
