import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import truncateText from 'truncate';
import queryString from 'query-string';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import c from 'classnames';

import Schema from 'src/components/common/Schema';
import getPath from 'src/util/getPath';
import { fetchEntity } from 'src/actions/index';

import './Entity.css';

class EntityLabel extends Component {
  render() {
    const { icon = false, truncate } = this.props;
    let { title, name: entityName, file_name, schema } = this.props.entity;
    
    // Trim names *before* checking to see which ones look okay to use
    title = title ? title.trim() : null;
    entityName = entityName ? entityName.trim() : null;
    file_name = file_name ? file_name.trim() : null;
    
    let text = title || entityName || file_name;

    if (truncate) {
      text = truncateText(text, truncate);
    }

    if (!text || !text.length || text.length < 1) {
      return (
        <span className='EntityLabel untitled'>
          {icon && <Schema.Icon schema={schema}/>}
          {icon && ' '}
          <FormattedMessage id='entity.label.missing'
                            defaultMessage="Untitled" />
        </span>
      );
    }
    
    return (
      <span className='EntityLabel' title={title || entityName}>
        {icon && <Schema.Icon schema={schema}/>}
        {icon && ' '}
        {text}
      </span>
    );
  }
}

class EntityLink extends Component {
  constructor() {
    super();
    this.onClick = this.onClick.bind(this);
  }

  onClick(event) {
    const { entity, history, location, preview } = this.props;
    event.preventDefault();

    if (preview === true) {
      const parsedHash = queryString.parse(location.hash);
      parsedHash['preview:id'] = entity.id;
      parsedHash['preview:type'] = entity.schemata.indexOf('Document') !== -1 ? 'document' : 'entity';
      if (parsedHash['preview:type'] === 'document' && !parsedHash['preview:maximised']) {
        parsedHash['preview:maximised'] = 'true';
      }

      history.replace({
        pathname: location.pathname,
        search: location.search,
        hash: queryString.stringify(parsedHash),
      });
    } else { 
      history.push({
        pathname: getPath(entity.links.ui)
      });
    }
  }

  render() {
    const { entity, className, icon, truncate } = this.props;
    if (!entity || !entity.links || !entity.schemata) {
      return <Entity.Label entity={entity} icon={icon} truncate={truncate}/>;
    }

    return (
      <a onClick={this.onClick} className={c('EntityLink', className)}>
        <Entity.Label entity={entity} icon={icon} truncate={truncate} />
      </a>
    );
  }
}

EntityLink = withRouter(EntityLink);


class EntityLoad extends Component {
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
    const { entity, children, renderWhenLoading } = this.props;
    if (
      (entity === undefined || entity.isFetching)
      && renderWhenLoading !== undefined
    ) {
      return renderWhenLoading;
    } else {
      return children(entity);
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  entity: state.entities[ownProps.id],
});
EntityLoad = connect(mapStateToProps, { fetchEntity })(EntityLoad);

EntityLoad.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
  renderWhenLoading: PropTypes.node,
}

class Entity {
  static Label = EntityLabel;
  static Link = EntityLink;
  static Load = EntityLoad;
}

export default Entity;
