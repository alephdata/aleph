import React, { PureComponent } from 'react';
import { FormattedRelative } from 'react-intl';

import Role from 'src/components/common/Role';
import Collection from 'src/components/common/Collection';
import Entity from 'src/components/common/Entity';

import './Notification.scss';


class Notification extends PureComponent {
  getParam(name) {
    const { event, params } = this.props.notification;
    const object = params[name];
    const type = event.params[name] || 'role';
    if (type === 'collection') {
      return <Collection.Link collection={object} preview icon />;
    }
    if (type === 'document' || type === 'entity') {
      return <Entity.Link entity={object} preview icon />;
    }
    if (type === 'alert') {
      return object ? object.query : null;
    }
    if (type === 'role') {
      return <Role.Label role={object} />;
    }
    return undefined;
  }

  convertUTCDateToLocalDate = (date) => {
    const newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
    const offset = date.getTimezoneOffset() / 60;
    const hours = date.getHours();
    newDate.setHours(hours - offset);
    return newDate;
  }

  render() {
    const { event, id, created_at: createdAt } = this.props.notification;
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

    return (
      <li key={id} className="Notification">
        <div className="timestamp">
          <FormattedRelative value={createdDate.toString()} />
        </div>
        {message}
      </li>
    );
  }
}

export default Notification;
