import {Link} from 'react-router-dom';
import React, {Component} from 'react';
import truncateText from 'truncate';

import Schema from 'src/components/common/Schema';
import getPath from 'src/util/getPath';

import './Entity.css';


class Label extends Component {
    render() {
        const {icon = false, addClass, iconClass, truncate} = this.props;
        let {title, name, file_name, schema} = this.props.entity;
        const className = addClass ? 'entity-label document_title' : 'entity-label';
        let text = title || name || file_name;

        if (truncate) {
            text = truncateText(text, truncate);
        }

        return (
            <span className={className} title={title || name}>
        {icon && (
            <Schema.Icon className={iconClass} schema={schema}/>
        )}
                {text}
      </span>
        );
    }
}

class EntityLink extends Component {
    render() {
        const {entity, className, icon, iconClass, truncate} = this.props;
        return (
            <Link to={getPath(entity.links.ui)} className={className}>
                <Label entity={entity} icon={icon} iconClass={iconClass} truncate={truncate}/>
            </Link>
        );
    }
}

class Entity {
    static Label = Label;
    static Link = EntityLink;
}

export default Entity;
