import React from 'react';

import { Entity, Schema } from 'components/common';

import 'components/common/ItemOverview.scss';


class EntityHeading extends React.PureComponent {
  render() {
    const { entity } = this.props;
    return (
      <>
        <span className="bp3-text-muted ItemOverview__heading__subtitle">
          <Schema.Label schema={entity.schema} icon />
        </span>
        <h1 className="ItemOverview__heading__title">
          {entity.schema.isThing() && (
            <Entity.Label entity={entity} addClass />
          )}
        </h1>
      </>
    );
  }
}


export default EntityHeading;
