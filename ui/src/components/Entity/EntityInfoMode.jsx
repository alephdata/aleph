import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Card } from '@blueprintjs/core';

import { Count, Collection } from 'src/components/common';
import EntityProperties from 'src/components/Entity/EntityProperties';

import './EntityInfoMode.scss';


function EntityInfoMode(props) {
  const { entity } = props;
  return (
    <EntityProperties entity={entity}>
      <li>
        <span className="key">
          <span>
            <FormattedMessage
              id="infoMode.collection"
              defaultMessage="Dataset"
            />
          </span>
        </span>
        <Card elevation={0} className="value collection-info">
          <span className="collection-info__item">
            <Collection.Link collection={entity.collection} icon />
          </span>
          {entity.collection.summary && (
            <Collection.Summary collection={entity.collection} className="collection-info__item" truncate={4} />
          )}
          <span className="collection-info__item">
            <FormattedMessage
              id="infoMode.collection.entries"
              defaultMessage="{count} entries"
              values={{
                count: <Count count={entity.collection.count} className="bp3-intent-primary" />,
              }}
            />
          </span>
        </Card>
      </li>
    </EntityProperties>
  );
}


export default EntityInfoMode;
