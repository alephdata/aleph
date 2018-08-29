import React, {Component} from 'react';
import { FormattedMessage } from 'react-intl';

import { Collection } from 'src/components/common';
import { CollectionOverview, CollectionInfoContent } from 'src/components/Collection';


class CollectionInfoMode extends Component {
  render() {
    const { collection } = this.props;
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
          <CollectionInfoContent collection={collection} schemata={collection.schemata}/>
        </div>
      </React.Fragment>
    );
  }
}

export default CollectionInfoMode;