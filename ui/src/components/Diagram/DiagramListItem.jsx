import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Card, Classes, Icon, H4 } from '@blueprintjs/core';
import getEntitySetLink from 'util/getEntitySetLink';
import c from 'classnames';

import {
  Collection, Date, Diagram, Skeleton, Summary,
} from 'components/common';

import './DiagramListItem.scss';

const DiagramListItem = ({ diagram, isPending, showCollection }) => {
  if (isPending) {
    return (
      <div className="DiagramListItem">
        <Card elevation={1} className="DiagramListItem__content">
          {showCollection && (
            <div className="DiagramListItem__collection">
              <Skeleton.Text type="span" length={15} />
            </div>
          )}
          <Icon className={c('DiagramListItem__icon', Classes.SKELETON)} icon="graph" iconSize={42} />
          <Skeleton.Text type="h4" length={15} className="DiagramLabel" />
          <Skeleton.Text className="summary" type="p" length={30} />
          <p className="details">
            <Skeleton.Text className="details-item" type="span" length={20} />
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="DiagramListItem" key={diagram.id}>
      <Link className="DiagramListItem__link" to={getEntitySetLink(diagram)}>
        <Card elevation={1} className="DiagramListItem__content">
          {showCollection && (
            <div className="DiagramListItem__collection">
              <Collection.Label collection={diagram.collection} className="bp3-text-muted" />
            </div>
          )}
          <Icon className="DiagramListItem__icon" icon="graph" iconSize={42} />
          <H4>
            <Diagram.Label diagram={diagram} />
          </H4>
          {diagram.summary && (
            <Summary text={diagram.summary} className="summary" truncate={2} />
          )}
          <p className="details">
            <span className="details-item">
              <Icon icon="time" iconSize={14} />
              <FormattedMessage
                id="diagram.last_updated"
                defaultMessage="Updated {date}"
                values={{
                  date: <Date value={diagram.updated_at} />,
                }}
              />
            </span>
          </p>
        </Card>
      </Link>
    </div>
  );
};

export default DiagramListItem;
