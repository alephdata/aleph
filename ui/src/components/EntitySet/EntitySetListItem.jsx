import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button, Classes, Icon, Intent, H5 } from '@blueprintjs/core';
import getEntitySetLink from 'util/getEntitySetLink';
import c from 'classnames';

import {
  Collection, Date, EntitySet, Skeleton, Summary,
} from 'components/common';

import './EntitySetIndexItem.scss';

const EntitySetIndexItem = ({ entitySet, isPending, onSelect, showCollection }) => {
  if (isPending) {
    return (
      <div className="EntitySetIndexItem">
        <div className="EntitySetIndexItem__content">
          {showCollection && (
            <div className="EntitySetIndexItem__collection">
              <Skeleton.Text type="span" length={15} />
            </div>
          )}
          <Skeleton.Text type="h4" length={15} className="DiagramLabel" />
          <Skeleton.Text className="summary" type="p" length={30} />
          <p className="details">
            <Skeleton.Text className="details-item" type="span" length={20} />
          </p>
        </div>
      </div>
    );
  }

  return (
    <li
      className="EntitySetIndexItem index-item"
      key={entitySet.id}
    >
      <div className="EntitySetIndexItem__flex-content">
        <H5 className="index-item__title">
          <EntitySet.Link className="index-item__title__text" entitySet={entitySet} icon />
        </H5>
        <span className="index-item__details">
          {showCollection && (
            <span className="index-item__details__item">
              <Collection.Link collection={entitySet.collection} className="bp3-text-muted" />
            </span>
          )}
          <span className="index-item__details__item">
            <Icon icon="time" iconSize={14} />
            <FormattedMessage
              id="entitySet.last_updated"
              defaultMessage="Updated {date}"
              values={{
                date: <Date value={entitySet.updated_at} />,
              }}
            />
          </span>
        </span>
      </div>
      {entitySet.summary && (
        <Summary text={entitySet.summary} className="index-item__summary" truncate={2} />
      )}
    </li>
  )
};




export default EntitySetIndexItem;
