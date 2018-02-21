import {Link} from 'react-router-dom';
import React, { Component, PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import truncateText from 'truncate';
import { connect } from 'react-redux';
import c from 'classnames';

import Schema from 'src/components/common/Schema';
import getPath from 'src/util/getPath';
import { fetchEntity } from 'src/actions';

import './Entity.css';


class EntityLabel extends Component {
  render() {
    const {icon = false, truncate} = this.props;
    let {title, name, file_name, schema} = this.props.entity;
    let text = title || name || file_name;

    if (!text || !text.length) {
      return (
        <span className='EntityLabel untitled'>
          {icon && <Schema.Icon schema={schema}/>}
          {icon && ' '}
          <FormattedMessage id='entity.label.missing'
                            defaultMessage="Untitled" />
        </span>
      );
    }

    if (truncate) {
      text = truncateText(text, truncate);
    }

    return (
      <span className='EntityLabel' title={title || name}>
        {icon && <Schema.Icon schema={schema}/>}
        {icon && ' '}
        {text}
      </span>
    );
  }
}

class EntityLink extends Component {
  render() {
    const {entity, className, icon, truncate} = this.props;
    if (!entity || !entity.links) {
      return <Entity.Label entity={entity} icon={icon} truncate={truncate}/>;
    }

    return (
      <Link to={getPath(entity.links.ui)} className={c('EntityLink', className)}>
        <Entity.Label entity={entity} icon={icon} truncate={truncate}/>
      </Link>
    );
  }
}


class EntityLabelById extends PureComponent {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { id, entity } = this.props;
    if (entity === undefined) {
      this.props.fetchEntity({ id });
    }
  }

  render() {
    const { entity, id, ...otherProps } = this.props;
    if (entity === undefined || entity.isFetching) {
      return (
        <code>{id}</code>
      );
    } else {
     return (
       <Entity.Label entity={entity} {...otherProps} />
     );
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  entity: state.entities[ownProps.id],
});
EntityLabelById = connect(mapStateToProps, { fetchEntity })(EntityLabelById);



class Entity {
  static Label = EntityLabel;
  static Link = EntityLink;
  static EntityLabelById = EntityLabelById;
}

export default Entity;
