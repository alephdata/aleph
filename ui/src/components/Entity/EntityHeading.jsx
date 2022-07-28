import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Entity, Schema, RelativeTime } from 'components/common';

import 'components/common/ItemOverview.scss';

class EntityHeading extends React.PureComponent {
  render() {
    const { entity, isProfile = false } = this.props;
    const lastViewedDate = entity.lastViewed
      ? new Date(parseInt(entity.lastViewed, 10))
      : Date.now();

    return (
      <>
        <span className="bp3-text-muted ItemOverview__heading__subtitle">
          <Schema.Label schema={entity.schema} icon />
          {isProfile && (
            <>
              {' · '}
              <FormattedMessage
                id="profile.info.header"
                defaultMessage="Profile"
              />
            </>
          )}
        </span>
        <h1 className="ItemOverview__heading__title">
          {entity.schema.isThing() && <Entity.Label entity={entity} addClass />}
        </h1>
        {entity.lastViewed && (
          <span className="ItemOverview__heading__last-viewed bp3-text-muted">
            <FormattedMessage
              id="entity.info.last_view"
              defaultMessage="Last viewed {time}"
              values={{ time: <RelativeTime date={lastViewedDate} /> }}
            />
          </span>
        )}
      </>
    );
  }
}

export default EntityHeading;
