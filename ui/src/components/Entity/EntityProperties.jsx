import React from 'react';
import _ from 'lodash';
import { FormattedMessage } from 'react-intl';
import { Mention, Property } from 'components/common';

class EntityProperties extends React.Component {
  render() {
    /* OK, so the idea here is to ALWAYS show featured properties
    because they are so important, that them not being set is a
    piece of information in itself. */
    const { entity, children } = this.props;
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
              <Mention.List prop={prop} values={entity.getProperty(prop)} missing={missing} />
            </span>
          </li>
        ))}
        {children}
      </ul>
    );
  }
}

export default EntityProperties;
