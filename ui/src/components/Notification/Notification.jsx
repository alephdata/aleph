import React, { PureComponent } from 'react';
import { selectUnit } from '@formatjs/intl-utils';
import { FormattedRelativeTime } from 'react-intl';

import {
  Collection, EntitySet, Entity, QueryText, Role, Skeleton, ExportLink
} from 'src/components/common';
import convertUTCDateToLocalDate from "util/convertUTCDateToLocalDate";

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
    if (type === 'entityset') {
      return <EntitySet.Link entitySet={object} icon />;
    }
    if (type === 'alert') {
      return object ? <QueryText query={object.query} /> : null;
    }
    if (type === 'role') {
      return <Role.Label role={object} />;
    }
    if (type === 'export') {
      return object ? <ExportLink export_={object} icon="export" /> : null;
    }
    return undefined;
  }

  renderSkeleton = () => (
    <li className="Notification">
      <div className="notification-action">
        <Skeleton.Text type="span" length={50} />
      </div>
      <div className="timestamp">
        <Skeleton.Text type="span" length={15} />
      </div>
    </li>
  )

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
        message.push((<div key={token} className="param">{param}</div>));
      } else if (token.length === 0) {
        return false;
      } else {
        message.push((<div key={token} className="token">{token}</div>));
      }
    });

    const createdDate = convertUTCDateToLocalDate(new Date(createdAt));
    const { value, unit } = selectUnit(createdDate, Date.now());
    return (
      <li key={id} className="Notification">
        <div className="notification-action">
          {message}
        </div>
        <div className="timestamp">
          <FormattedRelativeTime
            value={value}
            unit={unit}
            // eslint-disable-next-line
            style="long"
            numeric="auto"
          />
        </div>
      </li>
    );
  }
}

export default Notification;
