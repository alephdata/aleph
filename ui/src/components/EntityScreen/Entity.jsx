import { Link } from 'react-router-dom';
import React, { Component } from 'react';

import Schema from 'src/components/common/Schema';
import getPath from 'src/util/getPath';

import './Entity.css';


class Label extends Component {
  render() {
    const { icon = false, addClass, iconClass } = this.props;
    let { title, name, file_name, schema } = this.props.entity;
    const className = addClass ? 'entity-label document_title' : 'entity-label';
    
    return (
      <span className={className} title={ title || name }>
        {icon && (
          <Schema.Icon className={iconClass} schema={schema} />
        )}
        { title || name || file_name }
      </span>
    );
  }
}

class EntityLink extends Component {
  render() {
    const { entity, className, icon, short, iconClass } = this.props;
    return (
      <Link to={getPath(entity.links.ui)} className={className}>
        <Label entity={entity} icon={icon} iconClass={iconClass} short={short} />
      </Link>
    );
  }
}

class Entity {
  static Label = Label;
  static Link = EntityLink;
}

export default Entity;
