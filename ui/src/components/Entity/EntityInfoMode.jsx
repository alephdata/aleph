import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Callout } from '@blueprintjs/core';

import { Entity } from 'components/common';
import EntityProperties from 'components/Entity/EntityProperties';
import getProfileLink from 'util/getProfileLink';

import './EntityInfoMode.scss';


function EntityInfoMode(props) {
  const { entity, showProfileLinks = true } = props;
  const profileLink = getProfileLink(entity.profileId, { via: entity.id });
  return (
    <>
      {showProfileLinks && entity.profileId && (
        <Callout icon="layers" intent="primary" className="ProfileCallout">
          <FormattedMessage
            id="profile.items.intro"
            defaultMessage={"{entity} combines entities from other datasets <link>into a profile</link>. "}
            values={{
              entity: <Entity.Label entity={entity} />,
              link: chunks => <Link to={profileLink}>{chunks}</Link >,
            }}
          />
        </Callout>
      )}
      <EntityProperties entity={entity} />
    </>
  );
}

export default EntityInfoMode;
