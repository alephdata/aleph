import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Card, Classes, Icon, H4 } from '@blueprintjs/core';
import getEntitySetLink from 'src/util/getEntitySetLink';
import c from 'classnames';

import {
  Collection, Date, EntitySet, Skeleton, Summary,
} from 'src/components/common';

import './EntitySetListItem.scss';

const ICONS = {
  diagram: 'graph',
  timeline: 'timeline-events',
  generic: 'box'
}

const EntitySetListItem = ({ entitySet, isPending, showCollection }) => {
  const icon = ICONS[entitySet?.type || 'generic'];

  if (isPending) {
    return (
      <div className="EntitySetListItem">
        <Card elevation={1} className="EntitySetListItem__content">
          {showCollection && (
            <div className="EntitySetListItem__collection">
              <Skeleton.Text type="span" length={15} />
            </div>
          )}
          <Icon className={c('EntitySetListItem__icon', Classes.SKELETON)} icon={icon} iconSize={42} />
          <Skeleton.Text type="h4" length={15} className="EntitySetLabel" />
          <Skeleton.Text className="summary" type="p" length={30} />
          <p className="details">
            <Skeleton.Text className="details-item" type="span" length={20} />
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="EntitySetListItem" key={entitySet.id}>
      <Link className="EntitySetListItem__link" to={getEntitySetLink(entitySet)}>
        <Card elevation={1} className="EntitySetListItem__content">
          {showCollection && (
            <div className="EntitySetListItem__collection">
              <Collection.Label collection={entitySet.collection} className="bp3-text-muted" />
            </div>
          )}
          <Icon className="EntitySetListItem__icon" icon={icon} iconSize={42} />
          <H4>
            <EntitySet.Label entitySet={entitySet} />
          </H4>
          {entitySet.summary && (
            <Summary text={entitySet.summary} className="summary" truncate={2} />
          )}
          <p className="details">
            <span className="details-item">
              <Icon icon="time" iconSize={14} />
              <FormattedMessage
                id="entityset.last_updated"
                defaultMessage="Updated {date}"
                values={{
                  date: <Date value={entitySet.updated_at} />,
                }}
              />
            </span>
          </p>
        </Card>
      </Link>
    </div>
  );
};

export default EntitySetListItem;
