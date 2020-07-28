import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button, Classes, Icon, H6 } from '@blueprintjs/core';
import getEntitySetLink from 'util/getEntitySetLink';
import c from 'classnames';

import {
  Collection, Date, EntitySet, Skeleton, Summary,
} from 'components/common';

import './EntitySetListItem.scss';

const EntitySetListItem = ({ entitySet, isPending, onSelect, showCollection }) => {
  if (isPending) {
    return (
      <div className="EntitySetListItem">
        <div className="EntitySetListItem__content">
          {showCollection && (
            <div className="EntitySetListItem__collection">
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



  const content = (
    <>
      <div className="EntitySetListItem__main">
        <H6 className="EntitySetListItem__title">
          {!onSelect && <EntitySet.Link entitySet={entitySet} icon />}
          {onSelect && <EntitySet.Label entitySet={entitySet} icon />}
        </H6>
        <Summary text={entitySet.summary} className="summary" truncate={2} />
      </div>
      {showCollection && (
        <div className="EntitySetListItem__collection">
          <Collection.Link collection={entitySet.collection} className="bp3-text-muted" />
        </div>
      )}
      <p className="details">
        <span className="details-item">
          <Icon icon="time" iconSize={14} />
          <FormattedMessage
            id="entitySet.last_updated"
            defaultMessage="Updated {date}"
            values={{
              date: <Date value={entitySet.updated_at} />,
            }}
          />
        </span>
      </p>
    </>
  );
  if (onSelect) {
    return (
      <Button minimal onClick={() => onSelect(entitySet)} className="EntitySetListItem">
        {content}
      </Button>
    )
  }
  return <div className="EntitySetListItem">{content}</div>;
};




export default EntitySetListItem;
