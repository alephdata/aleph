import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import ReactMarkdown from 'react-markdown';

import { Collection } from 'src/components/common';
import CollectionStatus from 'src/components/Collection/CollectionStatus';

class CollectionHeading extends PureComponent {
  render() {
    const { collection } = this.props;
    return (
      <>
        <div className="pane-heading">
          <span className="bp3-text-muted">
            <Collection.Label collection={collection} label={false} />
            { collection.casefile && (
              <FormattedMessage id="collection.info.case" defaultMessage="Personal dataset" />
            )}
            { !collection.casefile && (
              <FormattedMessage id="collection.info.collection" defaultMessage="Dataset" />
            )}
          </span>
          <h1 itemProp="name">
            {collection.label}
          </h1>
          <CollectionStatus collection={collection} />
          <div className="bp3-text-muted bp3-running-text text-markdown" itemProp="description">
            <ReactMarkdown skipHtml linkTarget="_blank">{collection.summary}</ReactMarkdown>
          </div>
        </div>
      </>
    );
  }
}

export default CollectionHeading;
