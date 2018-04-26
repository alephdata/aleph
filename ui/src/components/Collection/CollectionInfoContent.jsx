import React from 'react';
import { FormattedNumber } from 'react-intl';

import { Schema } from 'src/components/common';


class CollectionInfoContent extends React.Component {

  sortByNumber(a,b) {
    if (a.number < b.number)
      return 1;
    if (a.number > b.number)
      return -1;
    return 0;
  }

  render() {
    const { collection } = this.props;
    let content = [];

    for (let key in collection.schemata) {
      if (collection.schemata.hasOwnProperty(key)) {
        content.push({name: key, number: collection.schemata[key]});
      }
    }
    content.sort(this.sortByNumber);

    return (
      <div className="xrefs">
        <ul className="info-rank">
          { content.map((item, index) => (
            <li key={index}>
              <span className="key">
                <Schema.Link schema={item.name} plural={true} url={`/search?filter:collection_id=${collection.id}&filter:schema=${item.name}`}/>
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

export default CollectionInfoContent;
