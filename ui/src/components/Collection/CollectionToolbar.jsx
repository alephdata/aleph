import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import { Toolbar, CloseButton, CollectionManageButton } from 'src/components/Toolbar';
import getCollectionLink from 'src/util/getCollectionLink';


class CollectionToolbar extends Component {
  render() {
    const { collection, isPreview = false } = this.props;

    return (
      <Toolbar className="toolbar-preview">
        <div className="bp3-button-group">
          <Link to={`/search?filter:collection_id=${collection.id}`} className="bp3-button button-link">
            <span className="bp3-icon-search" />
            <FormattedMessage id="collection.info.search_button" defaultMessage="Search" />
          </Link>
          {isPreview && (
            <Link to={getCollectionLink(collection)} className="bp3-button button-link">
              <span className="bp3-icon-folder-open" />
              <FormattedMessage id="collection.info.browse_button" defaultMessage="Browse" />
            </Link>
          )}
          <CollectionManageButton collection={collection} />
        </div>
        {isPreview && (
          <CloseButton />
        )}
      </Toolbar>
    );
  }
}

export default CollectionToolbar;
