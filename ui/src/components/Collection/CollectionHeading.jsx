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
    const { collection, showCategory = true, link = false } = this.props;
    const isPending = collection.isPending && !collection.label;

    if (isPending) {
      return this.renderSkeleton();
    }

    const LabelComponent = link ? Collection.Link : Collection.Label;

    return (
      <div className="CollectionHeading">
        {showCategory && (
          <div className="bp3-text-muted CollectionHeading__subheading">
            <Collection.Label collection={collection} label={false} />
            <Category.Label category={collection.category} />
          </div>
        )}
        <h2 itemProp="name" className="CollectionHeading__title">
          <LabelComponent collection={collection} icon={!showCategory} />
        </h2>
      </div>
    );
  }
}

export default CollectionHeading;
