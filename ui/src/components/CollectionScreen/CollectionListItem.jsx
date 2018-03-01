import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Icon } from "@blueprintjs/core";
import Truncate from 'react-truncate';

import Date from 'src/components/common/Date';
import Category from 'src/components/common/Category';
import Country from 'src/components/common/Country';
import Collection from 'src/components/common/Collection';

import './CollectionListItem.css';

class CollectionListItem extends Component {
  render() {
    const { collection } = this.props;
    if (!collection || !collection.id) {
      return null;
    }
    return (
      <li className="CollectionListItem">
        <h4>
          <Collection.Link collection={collection} icon />
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
