import React, {Component} from 'react';
import { FormattedRelative } from 'react-intl';

import Role from 'src/components/common/Role';
import Collection from 'src/components/common/Collection';
import Entity from 'src/components/common/Entity';

import './Notification.css';


class Notification extends Component {
  shouldComponentUpdate(nextProps) {
    return false;
  }

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
      return object.label;
    }
    if (type === 'role') {
      return <Role.Label role={object} />;
    }
  }

  render() {
    const { event, id, created_at } = this.props.notification;
    const parts = event.template.split(/({{|}})/);
    const message = [];

    let paramActive = false;
    for (let token of parts) {
      if (token === '{{') {
        paramActive = true;
      } else if (token === '}}') {
        paramActive = false;
      } else if (paramActive) {
        const param = this.getParam(token);
        message.push((<span className="param">{param}</span>));
      } else {
        message.push(token);
      }
    }

    return (
      <li key={id} className="Notification">
        <div className="timestamp">
          <FormattedRelative value={created_at}/>
        </div>
        <React.Fragment>
          {message.map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </React.Fragment>
      </li>
    );
  }
}

export default Notification;
