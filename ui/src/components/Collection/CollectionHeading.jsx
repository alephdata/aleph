import React, { PureComponent } from 'react';
import c from 'classnames';

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
    const { collection, showCategory = true, link = false, categoryLink = false } = this.props;

    if (collection?.label === undefined) {
      return this.renderSkeleton();
    }

    const CategoryComponent = categoryLink ? Category.Link : Category.Label;
    const CollectionComponent = link ? Collection.Link : Collection.Label;

    return (
      <div className={c("CollectionHeading", { "padded": !collection.casefile })}>
        {showCategory && (
          <div className="bp3-text-muted CollectionHeading__subheading">
            <Collection.Label collection={collection} label={false} />
            <CategoryComponent category={collection.category} />
          </div>
        )}
        <h2 itemProp="name" className="CollectionHeading__title">
          <CollectionComponent collection={collection} icon={!showCategory} />
        </h2>
      </div>
    );
  }
}

export default CollectionHeading;
