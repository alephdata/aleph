import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import ReactMarkdown from 'react-markdown';
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
          <Count className="bp3-intent-primary" count={collection.count} full />
          <Collection.Link preview={preview} collection={collection} icon />
        </H4>
        {collection.summary && (
          <div className="summary bp3-running-text">
            <Truncate lines={2}>
              <ReactMarkdown>
                { collection.summary }
              </ReactMarkdown>
            </Truncate>
          </div>
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
              <Role.List roles={collection.team} icon={false} truncate={3} />
            </span>
          )}
        </p>
      </li>
    );
  }
}

export default CollectionListItem;
