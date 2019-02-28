import _ from 'lodash';
import React, { PureComponent } from 'react';
import { FormattedNumber } from 'react-intl';

import { CollectionOverview } from 'src/components/Collection';
import { Schema } from 'src/components/common';


class CollectionInfoMode extends PureComponent {
  render() {
    const { collection } = this.props;
    const content = _.reverse(
      _.sortBy(
        Object.entries(collection.schemata)
          .map(([name, number]) => ({ name, number })),
        ['number'],
      ),
    );
    return (
      <div className="CollectionInfoMode">
        <CollectionOverview collection={collection} hasHeader={false} />
        <ul className="info-rank">
          { content.map(item => (
            <li key={item.name}>
              <span className="key">
                <Schema.Smart.Link
                  schema={item.name}
                  plural
                  url={`/search?filter:collection_id=${collection.id}&filter:schema=${item.name}`}
                />
              </span>
              <span className="value">
                <FormattedNumber value={item.number} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default CollectionInfoMode;
