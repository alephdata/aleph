import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon, H4 } from '@blueprintjs/core';
import Truncate from 'react-truncate';
import Count from 'src/components/common/Count';
import {
  Date, Role, Category, Country, Collection,
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
          <Count count={collection.count} full />
          <Collection.Link preview={preview} collection={collection} icon />
        </H4>
        {collection.summary
          && (
          <p className="summary">
            <Truncate lines={2} title={collection.summary}>
              { collection.summary }
            </Truncate>
          </p>
          )
        }
        <p className="details">
          { !collection.casefile && (
            <span className="details-item">
              <Icon icon="list" />
              <Category.Label collection={collection} />
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
              <Role.List roles={collection.team} icon={false} truncate={3} />
            </span>
          )}
        </p>
      </li>
    );
  }
}

export default CollectionListItem;
