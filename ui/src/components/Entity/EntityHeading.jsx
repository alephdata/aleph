import React from 'react';

import { Entity, Schema } from 'src/components/common';

import './EntityHeading.scss';

class EntityHeading extends React.PureComponent {
  render() {
    const { entity } = this.props;
    return (
      <div className="EntityHeading">
        <span className="bp3-text-muted">
          <Schema.Label schema={entity.schema} icon />
        </span>
        <h1>
          {entity.schema.isThing() && (
            <Entity.Label entity={entity} addClass />
          )}
        </h1>
      </div>
    );
  }
}


export default EntityHeading;
