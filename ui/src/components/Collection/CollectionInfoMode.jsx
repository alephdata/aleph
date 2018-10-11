import _ from 'lodash';
import React, {Component} from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import { Collection, Schema } from 'src/components/common';
import { CollectionOverview } from 'src/components/Collection';


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
      <React.Fragment>
        <div className="pane-heading">
          <span>
            <Collection.Label collection={collection} label={false} />
            { collection.casefile && (
              <FormattedMessage id="collection.info.case" defaultMessage="Casefile"/>
            )}
            { !collection.casefile && (
              <FormattedMessage id="collection.info.source" defaultMessage="Source"/>
            )}
          </span>
          <h1>
            {collection.label}
          </h1>
        </div>
        <div className="pane-content">
          <CollectionOverview collection={collection} hasHeader={false}/>
          <ul className="info-rank">
            { content.map((item, index) => (
              <li key={index}>
                <span className="key">
                  <Schema.Link schema={item.name}
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
      </React.Fragment>
    );
  }
}

export default CollectionInfoMode;