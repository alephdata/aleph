import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Entity, Schema } from 'components/common';

import 'components/common/ItemOverview.scss';


class EntityHeading extends React.PureComponent {
  render() {
    const { entity, isProfile = false } = this.props;
    return (
      <>
        <span className="bp3-text-muted ItemOverview__heading__subtitle">
          <Schema.Label schema={entity.schema} icon />
          {isProfile && (
            <>
              {' · '}
              < FormattedMessage
                id="profile.info.header"
                defaultMessage="Profile"
              />
            </>
          )}

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
