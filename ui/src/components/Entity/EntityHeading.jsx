import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import { Entity, Schema, RelativeTime } from '/src/components/common/index.jsx';

import '/src/components/common/ItemOverview.scss';

class EntityHeading extends React.PureComponent {
  render() {
    const { entity, isProfile = false } = this.props;
    const lastViewedDate = entity.lastViewed
      ? new Date(Number.parseInt(entity.lastViewed, 10))
      : Date.now();

    return (
      <>
        <span
          className={c(Classes.TEXT_MUTED, 'ItemOverview__heading__subtitle')}
        >
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
          <span
            className={c(
              'ItemOverview__heading__last-viewed',
              Classes.TEXT_MUTED
            )}
          >
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
