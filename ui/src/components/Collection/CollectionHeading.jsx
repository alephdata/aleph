import React, { PureComponent } from 'react';
import { Category, Collection, Skeleton } from 'components/common';

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
    const isPending = collection.isPending && !collection.label;

    if (isPending) {
      return this.renderSkeleton();
    }

    return (
      <div className="CollectionHeading">
        <span className="bp3-text-muted">
          <Collection.Label collection={collection} label={false} />
          <Category.Label category={collection.category} />
        </span>
        <h1 itemProp="name" className="CollectionHeading__title">
          {collection.label}
        </h1>
      </div>
    );
  }
}

export default CollectionHeading;
