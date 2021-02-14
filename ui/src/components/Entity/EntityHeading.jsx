import React from 'react';
import { FormattedMessage } from 'react-intl';
import getFormattedDate from 'util/getFormattedDate';

import { Entity, Schema } from 'components/common';

import 'components/common/ItemOverview.scss';


class EntityHeading extends React.PureComponent {
  render() {
    const { entity, isProfile = false } = this.props;
    const date = entity.lastViewed && getFormattedDate(new Date(parseInt(entity.lastViewed, 10)), window.__localId__);

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
        {entity.lastViewed && (
          <span>< FormattedMessage 
              id="entity.info.last_view" 
              defaultMessage="Last viewed" 
            /> {date}
          </span>
        )}
      </>
    );
  }
}


export default EntityHeading;
