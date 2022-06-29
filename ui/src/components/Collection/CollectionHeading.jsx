{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

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
    const { collection, link = false } = this.props;

    if (collection?.label === undefined) {
      return this.renderSkeleton();
    }

    const CollectionComponent = link ? Collection.Link : Collection.Label;

    return (
      <div className={c("CollectionHeading", { "padded": !collection.casefile })}>
        <div className="bp3-text-muted CollectionHeading__subheading">
          <Category.Link category={collection.category} icon={collection.casefile ? 'briefcase' : 'database'} />
        </div>
        <h2 itemProp="name" className="CollectionHeading__title">
          <CollectionComponent collection={collection} icon={false} />
        </h2>
      </div>
    );
  }
}

export default CollectionHeading;
