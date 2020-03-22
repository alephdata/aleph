import React, { PureComponent } from 'react';
import { selectUnit } from '@formatjs/intl-utils';
import { FormattedRelativeTime } from 'react-intl';

import {
  Collection, Diagram, Entity, QueryText, Role, Skeleton,
} from 'src/components/common';

import './Notification.scss';


class Notification extends PureComponent {
  getParam(name) {
    const { event, params } = this.props.notification;
    const object = params[name];
    const type = event.params[name] || 'role';
    if (type === 'collection') {
      return <Collection.Link collection={object} preview icon />;
    }
    if (type === 'entity') {
      return <Entity.Link entity={object} preview icon />;
    }
    if (type === 'diagram') {
      return <Diagram.Link diagram={object} />;
    }
    if (type === 'alert') {
      return object ? <QueryText query={object.query} /> : null;
    }
    if (type === 'role') {
      return <Role.Label role={object} />;
    }
    return undefined;
  }

  renderSkeleton = () => (
    <li className="Notification">
      <div className="timestamp">
        <Skeleton.Text type="span" length={15} />
      </div>
      <Skeleton.Text type="span" length={50} />
    </li>
  )

  convertUTCDateToLocalDate = (date) => {
    const newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
    const offset = date.getTimezoneOffset() / 60;
    const hours = date.getHours();
    newDate.setHours(hours - offset);
    return newDate;
  }

  render() {
    const { isPending, notification } = this.props;

    if (isPending) {
      return this.renderSkeleton();
    }

    const { event, id, created_at: createdAt } = notification;
    const parts = event.template.split(/({{|}})/);
    const message = [];

    let paramActive = false;
    // TODO: Could be done with Array.prototype.reducer very nicely
    parts.forEach((token) => {
      if (token === '{{') {
        paramActive = true;
      } else if (token === '}}') {
        paramActive = false;
      } else if (paramActive) {
        const param = this.getParam(token);
        message.push((<span key={token} className="param">{param}</span>));
      } else {
        message.push(token);
      }
    });

    const createdDate = this.convertUTCDateToLocalDate(new Date(createdAt));
    const { value, unit } = selectUnit(createdDate, Date.now());
    return (
      <li key={id} className="Notification">
        <div className="timestamp">
          <FormattedRelativeTime
            value={value}
            unit={unit}
            style="long"
            numeric="auto"
          />
        </div>
        {message}
      </li>
    );
  }
}

export default Notification;
