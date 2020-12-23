import React from 'react';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import { Mention, Property, Collection } from 'components/common';

class EntityProperties extends React.PureComponent {
  render() {
    /* OK, so the idea here is to ALWAYS show featured properties
    because they are so important, that them not being set is a
    piece of information in itself. */
    const { entity, showCollection = true } = this.props;
    const featured = entity.schema.getFeaturedProperties();
    const existing = entity.getProperties().filter(prop => !prop.hidden);
    const sorted = _.sortBy(existing, p => p.label).filter(p => featured.indexOf(p) === -1);
    const properties = [...featured, ...sorted];
    const missing = (
      <FormattedMessage
        id="entity.properties.missing"
        defaultMessage="unknown"
      />
    );
    return (
      <ul className="EntityInfoMode info-sheet">
        { properties.map(prop => (
          <li key={prop.name}>
            <span className="key">
              <Property.Name prop={prop} />
            </span>
            <span className="value">
              <Mention.List prop={prop} values={entity.getProperty(prop)} missing={missing} translitLookup={entity.latinized} />
            </span>
          </li>
        ))}
        {(showCollection && entity?.collection?.id) && (
          <li>
            <span className="key">
              <span>
                {entity.collection.casefile && (
                  <FormattedMessage
                    id="infoMode.collection_casefile"
                    defaultMessage="Investigation"
                  />
                )}
                {!entity.collection.casefile && (
                  <FormattedMessage
                    id="infoMode.collection"
                    defaultMessage="Dataset"
                  />
                )}
              </span>
            </span>
            <span className="value">
              <Collection.Link collection={entity.collection} icon />
            </span>
          </li>
        )}
      </ul>
    );
  }
}

export default EntityProperties;
