import _ from "lodash";
import React, {Component} from 'react';
import { FormattedNumber } from 'react-intl';

import { CollectionOverview } from 'src/components/Collection';
import { Schema } from 'src/components/common';


class CollectionInfoMode extends Component {
  render() {
    const { collection } = this.props;
    let content = [];
    for (let key in collection.schemata) {
      if (collection.schemata.hasOwnProperty(key)) {
        content.push({name: key, number: collection.schemata[key]});
      }
    }
    content = _.reverse(_.sortBy(content, ['number']));
    return (
      <div className="CollectionInfoMode">
        <CollectionOverview collection={collection} hasHeader={false}/>
        <ul className="info-rank">
          { content.map((item, index) => (
            <li key={index}>
                <span className="key">
                  <Schema.Smart.Link schema={item.name}
                               plural={true}
                               url={`/search?filter:collection_id=${collection.id}&filter:schema=${item.name}`}/>
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
