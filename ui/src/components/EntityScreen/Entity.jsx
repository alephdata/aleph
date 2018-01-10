import { Link } from 'react-router-dom';
import React, { Component } from 'react';
import truncateText from 'truncate';

import Schema from 'src/components/common/Schema';
import getPath from 'src/util/getPath';


class Label extends Component {
  render() {
    const { icon = false, truncate } = this.props;
    let { title, name, file_name, schema } = this.props.entity;
    let text = title || name || file_name;

    if (truncate) {
      text = truncateText(text, truncate);
    }
    
    return (
      <span className="entity-label" title={ title || name }>
        {icon && (
          <Schema.Icon schema={schema} />
        )}
        { text }
      </span>
    );
  }
}

class EntityLink extends Component {
  render() {
    const { entity, className, icon, truncate } = this.props;
    return (
      <Link to={getPath(entity.links.ui)} className={className}>
        <Label entity={entity} icon={icon} truncate={truncate} />
      </Link>
    );
  }
}

class Entity {
  static Label = Label;
  static Link = EntityLink;
}

export default Entity;
