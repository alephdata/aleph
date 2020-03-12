import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Card, Classes, Icon, H4 } from '@blueprintjs/core';
import getDiagramLink from 'src/util/getDiagramLink';
import c from 'classnames';

import {
  Collection, Date, Diagram, Summary,
} from 'src/components/common';

import './DiagramListItem.scss';

const DiagramListItem = ({ diagram, isLoading, showCollection }) => {
  if (isLoading) {
    return (
      <div className="DiagramListItem">
        <Card elevation={1} className={c('DiagramListItem__content', Classes.SKELETON)} />
      </div>
    );
  }
  return (
    <div className="DiagramListItem" key={diagram.id}>
      <Link className="DiagramListItem__link" to={getDiagramLink(diagram)}>
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
}

export default DiagramListItem;
