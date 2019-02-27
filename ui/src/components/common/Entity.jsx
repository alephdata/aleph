import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import truncateText from 'truncate';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import c from 'classnames';

import { Schema } from 'src/components/common';
import getPath from 'src/util/getPath';
import togglePreview from 'src/util/togglePreview';
import { fetchEntity as fetchEntityAction } from 'src/actions';
import { selectEntity, selectSchemata } from 'src/selectors';
import { Entity as EntityClass } from 'src/followthemoney/Entity.ts';
import './Entity.scss';


class EntityLabel extends Component {
  shouldComponentUpdate(nextProps) {
    const { entity = {} } = this.props;
    const { entity: nextEntity = {} } = nextProps;
    return entity.id !== nextEntity.id;
  }

  render() {
    const {
      entity, icon = false, documentMode = false, truncate,
    } = this.props;
    if (entity === undefined) {
      return null;
    }
    let { title, name: entityName, file_name: fileName } = entity;
    // Trim names *before* checking to see which ones look okay to use
    title = title ? title.trim() : null;
    entityName = entityName ? entityName.trim() : null;
    fileName = fileName ? fileName.trim() : null;

    let text = title || entityName || fileName;

    if (truncate) {
      text = truncateText(text, truncate);
    }

    if (documentMode) {
      text = fileName || text;
    }

    const entityClassName = entity.status === 'pending' ? 'EntityLabel disabled' : 'EntityLabel';

    if (!text || !text.length || text.length < 1) {
      return (
        <span className="EntityLabel untitled">
          {icon && <Schema.Icon schema={entity.schema} />}
          {icon && ' '}
          <FormattedMessage id="entity.label.missing" defaultMessage="Untitled" />
        </span>
      );
    }

    return (
      <span className={entityClassName} title={title || entityName}>
        {icon && <Schema.Icon schema={entity.schema} />}
        {icon && ' '}
        {text}
      </span>
    );
  }
}

@withRouter
class EntityLink extends Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    const { entity, history, preview } = this.props;
    if (preview) {
      const isDocument = entity.schema.isDocument();
      const previewType = isDocument ? 'document' : 'entity';
      event.preventDefault();
      togglePreview(history, entity, previewType);
    }
  }

  render() {
    const { entity, className } = this.props;
    if (!entity || !entity.links || !entity.schemata || entity.status === 'pending') {
      return <Entity.Label {...this.props} />;
    }

    const link = getPath(entity.links.ui);
    return (
      <Link to={link} onClick={this.onClick} className={c('EntityLink', className)}>
        <Entity.Label {...this.props} />
      </Link>
    );
  }
}


const mapStateToProps = (state, ownProps) => ({
  entity: selectEntity(state, ownProps.id),
});

@connect(mapStateToProps, { fetchEntity: fetchEntityAction })
class EntityLoad extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { id, entity, fetchEntity } = this.props;
    if (entity.shouldLoad) {
      fetchEntity({ id });
    }
  }

  render() {
    const { entity, children, renderWhenLoading } = this.props;
    if (entity.isLoading && renderWhenLoading !== undefined) {
      return renderWhenLoading;
    }
    return children(entity);
  }
}


EntityLoad.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
  renderWhenLoading: PropTypes.node.isRequired,
};
function SmartEntityHOC(InnerComponent) {
  return function SmartEntityComponent(props) {
    const { schemata, entity: entityPure, ...rest } = props;
    const schema = schemata.getSchema(entityPure.schema);
    const entity = new EntityClass(schema, entityPure);
    return (
      <InnerComponent
        entity={entity}
        {...rest}
      />
    );
  };
}

class Entity {
  static Smart = {
    Link: connect(state => ({ schemata: selectSchemata(state) }))(SmartEntityHOC(EntityLink)),
  };

  static Label = EntityLabel;

  static Link = EntityLink;

  static Load = EntityLoad;
}

export default Entity;
