import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Card, Icon, H4 } from '@blueprintjs/core';
import c from 'classnames';

import {
  Collection, Date, Diagram,
} from 'src/components/common';

import './DiagramListItem.scss';


class DiagramListItem extends PureComponent {
  render() {
    const { diagram, showCollection } = this.props;
    return (
      <div className="DiagramListItem" key={diagram.id}>
        <Link className="DiagramListItem__link" to={`/diagrams/${diagram.id}`}>
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
              <Diagram.Summary diagram={diagram} className="summary" truncate={2} />
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
}

export default DiagramListItem;
