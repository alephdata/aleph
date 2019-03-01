import React from 'react';

import { Entity, Schema } from 'src/components/common';


class EntityHeading extends React.PureComponent {
  render() {
    const { entity } = this.props;
    const isThing = entity.schema.isThing();

    return (
      <React.Fragment>
        <div className="pane-heading">
          <span>
            <Schema.Label schema={entity.schema} icon />
          </span>
          <h1>
            {isThing && (
              <Entity.Label entity={entity} addClass />
            )}
          </h1>
        </div>
      </React.Fragment>
    );
  }
}


export default EntityHeading;
