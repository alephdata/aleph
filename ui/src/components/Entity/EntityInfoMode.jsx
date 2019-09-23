import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { Count } from 'src/components/common';
import getCollectionLink from 'src/util/getCollectionLink';
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
        <span className="value bp3-running-text">
          <ul className="collection-info">
            <li>
              <Link to={getCollectionLink(entity.collection)}>
                <b>{entity.collection.label}</b>
              </Link>
            </li>
            {entity.collection.summary && (
              <li>
                <span className="bp3-text-muted">{entity.collection.summary}</span>
              </li>
            )}
            <li>
              <span>
                <FormattedMessage
                  id="infoMode.collection.entries"
                  defaultMessage="{count} entries"
                  values={{
                    count: <Count count={entity.collection.count} />,
                  }}
                />
              </span>
            </li>
          </ul>
        </span>
      </li>
    </EntityProperties>
  );
}


export default EntityInfoMode;
