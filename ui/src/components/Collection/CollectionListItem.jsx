import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Icon, H4 } from "@blueprintjs/core";
import Truncate from 'react-truncate';

import { Date, Role, Category, Country, Collection } from 'src/components/common';

import './CollectionListItem.scss';


class CollectionListItem extends Component {
  render() {
    const { collection, preview = true } = this.props;
    if (!collection.id) {
      return null;
    }
    return (
      <li className="CollectionListItem" key={collection.id}>
        <H4>
          <span className="bp3-tag bp3-small bp3-round bp3-intent-primary">
            <FormattedNumber value={collection.count} />
          </span>
          <Collection.Link preview={preview} collection={collection} icon />
        </H4>
        {collection.summary &&
          <p className="summary">
            <Truncate lines={2} title={collection.summary}>
              { collection.summary }
            </Truncate>
          </p>
        }
        <p className="details">
          { !collection.casefile && (
            <span className="details-item">
              <Icon icon="list" />
              <Category collection={collection} />
            </span>
          )}

          <span className="details-item">
            <Icon icon="time" />
            <FormattedMessage id="collection.last_updated"
                              defaultMessage="Updated {date}"
                              values={{
                                date: <Date value={collection.updated_at} />
                              }}/>
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
