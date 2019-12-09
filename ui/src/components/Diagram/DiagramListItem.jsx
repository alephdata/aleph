import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Icon, H4 } from '@blueprintjs/core';

import {
  Collection, Date, Diagram,
} from 'src/components/common';

import './DiagramListItem.scss';


class DiagramListItem extends PureComponent {
  render() {
    const { diagram } = this.props;

    return (
      <li className="DiagramListItem" key={diagram.id}>
        <H4>
          <Diagram.Link diagram={diagram} icon />
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
          <span className="details-item">
            <Collection.Link collection={diagram.collection} icon />
          </span>
        </p>
      </li>
    );
  }
}

export default DiagramListItem;
