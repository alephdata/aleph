import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon, H4 } from '@blueprintjs/core';
import Count from 'src/components/common/Count';
import {
  Date, Role, Category, Country, Collection, Summary,
} from 'src/components/common';

import './CollectionListItem.scss';


class CollectionListItem extends PureComponent {
  render() {
    const { collection, preview = true } = this.props;
    if (!collection.id) {
      return null;
    }
    return (
      <li className="CollectionListItem" key={collection.id}>
        <H4>
          <Count className="bp3-intent-primary" count={collection.count} full />
          <Collection.Link preview={preview} collection={collection} icon />
        </H4>
        {collection.summary && (
          <Summary text={collection.summary} className="summary" truncate={2} />
        )}
        <p className="details">
          { !collection.casefile && (
            <span className="details-item">
              <Category.Label collection={collection} icon />
            </span>
          )}

          <span className="details-item">
            <Icon icon="time" />
            <FormattedMessage
              id="collection.last_updated"
              defaultMessage="Updated {date}"
              values={{
                date: <Date value={collection.updated_at} />,
              }}
            />
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

export default CollectionListItem;
