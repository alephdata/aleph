import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Category, Collection, Skeleton } from 'src/components/common';

import './CollectionHeading.scss';

class CollectionHeading extends PureComponent {
  renderSkeleton = () => (
    <div className="CollectionHeading">
      <Skeleton.Text type="span" length={20} className="bp3-text-muted" />
      <Skeleton.Text type="h1" length={20} className="CollectionHeading__title" />
    </div>
  )

  render() {
    const { collection } = this.props;
    const isLoading = (collection.isLoading || collection.shouldLoad) && !collection.label;

    if (isLoading) {
      return this.renderSkeleton();
    }

    return (
      <div className="CollectionHeading">
        <span className="bp3-text-muted">
          <Collection.Label collection={collection} label={false} />
          { collection.casefile && (
            <FormattedMessage id="collection.info.case" defaultMessage="Personal dataset" />
          )}
          { !collection.casefile && (
            <Category.Label collection={collection} />
          )}
        </span>
        <h1 itemProp="name" className="CollectionHeading__title">
          {collection.label}
        </h1>
      </div>
    );
  }
}

export default CollectionHeading;
