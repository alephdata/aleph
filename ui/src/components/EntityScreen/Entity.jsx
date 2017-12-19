import { toString } from 'lodash';
import { Link } from 'react-router-dom';
import React, { Component } from 'react';

import getPath from 'src/util/getPath';


class Label extends Component {
  render() {
    let { title, name, file_name } = this.props.entity;
    title = toString(title);
    name = toString(name);
    file_name = toString(file_name);

    if (title && file_name && title !== file_name) {
        return (
            <span className="entity-label">
                <span className="title">{title} </span>
                <span className="file-name">{file_name}</span>
            </span>
        );
    }
    
    return (
      <span className="entity-label">{ title || name }</span>
    );
  }
}

class EntityLink extends Component {
  render() {
    const { entity, className } = this.props;
    
    return (
      <Link to={getPath(entity.links.ui)} className={className}>
        <Label entity={entity} />
      </Link>
    );
  }
}

class Entity {
  static Label = Label;
  static Link = EntityLink;
}

export default Entity;
