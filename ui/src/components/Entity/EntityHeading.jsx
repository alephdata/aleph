import React from 'react';

import { Entity, Schema } from 'src/components/common';


class EntityHeading extends React.PureComponent {
  render() {
    const { entity } = this.props;
    return (
      <React.Fragment>
        <div className="pane-heading">
          <span className="bp3-text-muted">
            <Schema.Label schema={entity.schema} icon />
          </span>
          <h1>
            {entity.schema.isThing() && (
              <Entity.Label entity={entity} addClass />
            )}
          </h1>
        </div>
      </React.Fragment>
    );
  }
}


export default EntityHeading;
