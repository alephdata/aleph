import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Icon } from "@blueprintjs/core";
import Truncate from 'react-truncate';

import { Date, Category, Country, Collection } from 'src/components/common';

import './CollectionListItem.css';

class CollectionListItem extends Component {
  shouldComponentUpdate(nextProps) {
    return !this.props.collection.id || this.props.collection.id !== nextProps.collection.id;
  }

  render() {
    const { collection } = this.props;
    if (!collection || !collection.id) {
      return null;
    }
    return (
      <li className="CollectionListItem" key={collection.id}>
        <h4>
          <span className="pt-tag pt-small pt-round pt-intent-primary">
            <FormattedNumber value={collection.count} />
          </span>
          <Collection.Link preview={true} collection={collection} icon />
        </h4>
        {collection.summary &&
          <p className="summary">
            <Truncate lines={2} title={collection.summary}>
              { collection.summary }
            </Truncate>
          </p>
        }
        <p className="details">
          <span className="details-item">
            <Icon icon="list" />
            <Category collection={collection} />
          </span>

          <span className="details-item">
            <Icon icon="time" />
            <FormattedMessage id="collection.last_updated"
                              defaultMessage="Updated {date}"
                              values={{
                                date: <Date value={collection.updated_at} />
                              }}/>
          </span>
          
          { collection.countries.length > 0 && (
            <span className="details-item">
              <Icon icon="globe" />
              <Country.List codes={collection.countries} truncate={4} />
            </span>
          )}
        </p>
      </li>
    );
  }
}

export default CollectionListItem;
