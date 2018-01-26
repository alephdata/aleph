import {Link} from 'react-router-dom';
import React, { Component, PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import truncateText from 'truncate';
import { connect } from 'react-redux';

import Schema from 'src/components/common/Schema';
import getPath from 'src/util/getPath';
import { fetchEntity } from 'src/actions';

import './Entity.css';


class Label extends Component {
  render() {
    const {icon = false, truncate} = this.props;
    let {title, name, file_name, schema} = this.props.entity;
    let text = title || name || file_name;

    if (!text || !text.length) {
      return (
        <span className='entity-label untitled'>
          {icon && (
              <Schema.Icon schema={schema}/>
          )}
          <FormattedMessage id='entity.label.missing'
                            defaultMessage="Untitled" />
        </span>
      );
    }

    if (truncate) {
      text = truncateText(text, truncate);
    }

    return (
      <span className='entity-label' title={title || name}>
        {icon && (
          <Schema.Icon schema={schema}/>
        )}
        {text}
      </span>
    );
  }
}

class EntityLink extends Component {
  render() {
    const {entity, className, icon, truncate} = this.props;
    if (!entity || !entity.links) {
      return <Label entity={entity} icon={icon} truncate={truncate}/>;
    }

    return (
      <Link to={getPath(entity.links.ui)} className={className}>
        <Label entity={entity} icon={icon} truncate={truncate}/>
      </Link>
    );
  }
}


class LabelById extends PureComponent {
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
LabelById = connect(mapStateToProps, { fetchEntity })(LabelById);



class Entity {
  static Label = Label;
  static Link = EntityLink;
  static LabelById = LabelById;
}

export default Entity;
