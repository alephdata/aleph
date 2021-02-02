import React from 'react';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import { Mention, Property, Collection, Role, Date } from 'components/common';

import './EntityProperties.scss';

class EntityProperties extends React.PureComponent {
  render() {
    /* OK, so the idea here is to ALWAYS show featured properties
    because they are so important, that them not being set is a
    piece of information in itself. */
    const { entity, showMetadata = true } = this.props;
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
      <>
        <div className="ItemOverview__content__section">
          <ul className="EntityProperties info-sheet">
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
          </ul>
        </div>
        {showMetadata && (
          <div className="ItemOverview__content__section">
            <ul className="EntityProperties info-sheet">
              {entity.collection?.id && (
                <li key="collection">
                  <span className="key">
                    <>
                      {entity.collection.casefile && (
                        <FormattedMessage
                          id="infoMode.collection_casefile"
                          defaultMessage="Investigation"
                        />
                      )}
                      {!entity.collection.casefile && (
                        <FormattedMessage
                          id="infoMode.collection_dataset"
                          defaultMessage="Dataset"
                        />
                      )}
                    </>
                  </span>
                  <span className="value big">
                    <Collection.Link collection={entity.collection} icon />
                  </span>
                </li>
              )}
              {entity.role?.id && (
                <li key="role">
                  <span className="key">
                    <FormattedMessage
                      id="infoMode.creator"
                      defaultMessage="Created by"
                    />
                  </span>
                  <span className="value big">
                    <Role.Link role={entity.role} />
                  </span>
                </li>
              )}
              {entity.createdAt && (
                <li key="created">
                  <span className="key">
                    <FormattedMessage
                      id="infoMode.createdAt"
                      defaultMessage="Created at"
                    />
                  </span>
                  <span className="value">
                    <Date value={entity.createdAt} />
                  </span>
                </li>
              )}
              {entity.updatedAt && (
                <li key="updated">
                  <span className="key">
                    <FormattedMessage
                      id="infoMode.updatedAt"
                      defaultMessage="Last updated"
                    />
                  </span>
                  <span className="value">
                    <Date value={entity.updatedAt} />
                  </span>
                </li>
              )}
            </ul>
          </div>
        )}
      </>
    );
  }
}

export default EntityProperties;
