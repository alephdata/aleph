import _ from 'lodash';
import React, {Component} from 'react';
import { FormattedMessage } from 'react-intl';

import { Collection } from 'src/components/common';


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
      </React.Fragment>
    );
  }
}

export default CollectionInfoMode;