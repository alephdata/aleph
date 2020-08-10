import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon, H4 } from '@blueprintjs/core';
import {
  Date, Role, Category, Count, Country, Collection, Summary, Skeleton, Frequency,
} from 'components/common';

import './CollectionIndexItem.scss';


class CollectionIndexItem extends PureComponent {
  renderSkeleton = () => (
    <li className="CollectionIndexItem">
      <H4>
        <Count className='bp3-intent-primary' full isPending />
        <Skeleton.Text type="span" length={20} />
      </H4>
      <Skeleton.Text className="summary" type="p" length={200} />
      <p className="details">
        <Skeleton.Text className="details-item" type="span" length={20} />
        <Skeleton.Text className="details-item" type="span" length={20} />
        <Skeleton.Text className="details-item" type="span" length={20} />
      </p>
    </li>
  )

  render() {
    const { collection, isPending, preview = true } = this.props;

    if (isPending) {
      return this.renderSkeleton();
    }

    if (!collection.id) {
      return null;
    }

    return (
      <li className="CollectionIndexItem" key={collection.id}>
        <H4>
          <Count className="bp3-intent-primary" count={collection.count} full />
          <Collection.Link preview={preview} collection={collection} icon />
        </H4>
        {collection.summary && (
          <Summary text={collection.summary} className="summary" truncate={2} />
        )}
        <p className="details">
          <span className="details-item">
            <Category.Label category={collection.category} icon />
          </span>
          <span className="details-item">
            <Icon icon="time" />
            <FormattedMessage
              id="collection.last_updated"
              defaultMessage="Last updated {date}"
              values={{
                date: <Date value={collection.updated_at} />,
              }}
            />
            {collection.frequency !== 'never' && collection.frequency !== 'unknown' && (
              <Frequency.Label frequency={collection.frequency} />
            )}
          </span>
          { collection.countries && collection.countries.length > 0 && (
            <span className="details-item">
              <Icon icon="globe" />
              <Country.List codes={collection.countries} truncate={3} />
            </span>
          )}
          { collection.casefile && (
            <span className="details-item">
              <Icon icon="social-media" />
              <Role.List roles={collection.team} icon={false} truncate={3} separateItems />
            </span>
          )}
        </p>
      </li>
    );
  }
}

export default CollectionIndexItem;
