import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Category, Collection } from 'src/components/common';

import './CollectionHeading.scss';


class CollectionHeading extends PureComponent {
  render() {
    const { collection } = this.props;
    return (
      <div className="CollectionHeading">
        <span className="bp3-text-muted ">
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
