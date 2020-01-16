import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Card, Icon, H4 } from '@blueprintjs/core';

import {
  Collection, Date, Diagram,
} from 'src/components/common';

import './DiagramListItem.scss';


class DiagramListItem extends PureComponent {
  render() {
    const { diagram, showCollection } = this.props;

    console.log('DIAGRAM', diagram);

    return (
      <div className="DiagramListItem" key={diagram.id}>
        <Card elevation={0}>
          {showCollection && (
            <div className="DiagramListItem__collection">
              <Collection.Link collection={diagram.collection} icon />
            </div>
          )}
          <Icon className="DiagramListItem__icon" icon="graph" iconSize={42} />
          <H4>
            <Diagram.Link diagram={diagram} />
          </H4>
          {diagram.summary && (
            <Diagram.Summary diagram={diagram} className="summary" truncate={2} />
          )}
          <p className="details">
            <span className="details-item">
              <Icon icon="time" />
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
      </div>
    );
  }
}

export default DiagramListItem;
