import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Card } from '@blueprintjs/core';

import { Count, Collection, Summary } from 'components/common';
import EntityProperties from 'components/Entity/EntityProperties';

import './EntityInfoMode.scss';


function EntityInfoMode(props) {
  const { entity } = props;
  const isCasefile = entity.collection?.casefile;
  return (
    <EntityProperties entity={entity}>
      {entity.collection && (
        <li>
          <span className="key">
            <span>
              {isCasefile && (
                <FormattedMessage
                  id="infoMode.collection_casefile"
                  defaultMessage="Investigation"
                />
              )}
              {!isCasefile && (
                <FormattedMessage
                  id="infoMode.collection"
                  defaultMessage="Dataset"
                />
              )}
            </span>
          </span>
          <Card elevation={0} className="value collection-info">
            <span className="collection-info__item">
              <Collection.Status collection={entity.collection} showPopover icon LabelComponent={Collection.Link} />
            </span>
            {entity.collection.summary && (
              <Summary text={entity.collection.summary} className="collection-info__item" truncate={4} />
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
      )}
    </EntityProperties>
  );
}

export default EntityInfoMode;
