import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Card } from '@blueprintjs/core';

import { Count, Collection, Summary } from 'components/common';
import EntityProperties from 'components/Entity/EntityProperties';

import './EntityInfoMode.scss';

const messages = defineMessages({
  collection_casefile: {
    id: 'infoMode.collection_casefile',
    defaultMessage: 'Investigation',
  },
  collection: {
    id: 'infoMode.collection',
    defaultMessage: 'Dataset',
  },
});


function EntityInfoMode(props) {
  const { entity, intl, isPreview } = props;

  const isCasefile = entity.collection?.casefile;
  const showCollection = entity.collection && (!isCasefile || isPreview);
  const collectionLabel = intl.formatMessage(messages[isCasefile ? 'collection_casefile' : 'collection']);

  return (
    <EntityProperties entity={entity}>
      {showCollection && (
        <li>
          <span className="key">
            <span>{collectionLabel}</span>
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

export default injectIntl(EntityInfoMode);
