import React from 'react';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages } from 'react-intl';
import queryString from "query-string";
import { Tooltip, Position } from '@blueprintjs/core';
import c from 'classnames';
import { connect } from "react-redux";

import { Schema } from 'src/components/common';
import { fetchEntityReferences, fetchEntityTags } from "src/actions";
import { selectEntityReferences, selectEntityTags } from "src/selectors";
import getPath from "src/util/getPath";

import './ViewsMenu.css';

const messages = defineMessages({
  tags: {
    id: 'document.mode.text.tags',
    defaultMessage: 'Tags',
  },
  similar: {
    id: 'document.mode.text.similar',
    defaultMessage: 'Similar',
  }
});

class EntityViewsMenu extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const {entity, references, tags} = this.props;
    if (entity.id !== undefined) {
      if (references.shouldLoad) {
        this.props.fetchEntityReferences(entity);
      }
      if (tags.shouldLoad) {
        this.props.fetchEntityTags(entity);
      }
    }
  }

  onClick(event, mode) {
    const {entity, history} = this.props;
    event.preventDefault();
    const path = getPath(entity.links.ui);
    let tabName = mode;
    if(mode !== 'similar' && mode !== 'tags') {
      tabName = 'references-' + mode;
    }
    const query = queryString.stringify({'mode': tabName});
    history.replace({
      pathname: path,
      hash: query
    });
  }

  render() {
    const {intl, tags, references, isPreview, mode} = this.props;
    const className = !isPreview ? 'ViewsMenu FullPage' : 'ViewsMenu';

    return (
      <div className={className}>
        {references.results !== undefined && references.results.map((ref) => (
          <Tooltip key={ref.property.qname} content={ref.property.reverse + ' (' + ref.count + ')'}
                   position={Position.BOTTOM_RIGHT}>
            <a key={ref.property.qname}
               onClick={(e) => this.onClick(e, ref.property.qname)}
               className={c('ModeButtons', 'pt-button pt-large', {'pt-active': mode === 'references-' + ref.property.qname})}>
              <Schema.Icon schema={ref.schema}/>
            </a></Tooltip>
        ))}
        <Tooltip content={intl.formatMessage(messages.similar)} position={Position.BOTTOM_RIGHT}><a
          onClick={(e) => this.onClick(e, 'similar')}
          className={c('ModeButtons', 'pt-button pt-large', {'pt-active': mode === 'similar'})}>
          <i className="fa fa-fw far fa-repeat"/> {/* change icon for similar, we don't have it right now */}
        </a></Tooltip>
        <Tooltip content={intl.formatMessage(messages.tags)} position={Position.BOTTOM_RIGHT}><a
          onClick={(e) => this.onClick(e, 'tags')}
          className={c('ModeButtons', 'pt-button pt-large', {'pt-active': mode === 'tags'})}>
          <i className="fa fa-fw fa-tags"/>
        </a></Tooltip>
        {/*<a onClick={(e) => this.goToTags(e, 'info')}
           className={c('ModeButtons', 'pt-button')} title={intl.formatMessage(messages.tags)} >
          <span className="pt-icon-standard pt-icon-tag"/>
        </a>*/}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {location} = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const mode = hashQuery.mode || 'view';
  return {
    hashQuery,
    mode,
    references: selectEntityReferences(state, ownProps.entity.id),
    tags: selectEntityTags(state, ownProps.entity.id)
  };
};

EntityViewsMenu = connect(mapStateToProps, {
  fetchEntityReferences,
  fetchEntityTags
}, null, {pure: false})(EntityViewsMenu);
EntityViewsMenu = injectIntl(EntityViewsMenu);
EntityViewsMenu = withRouter(EntityViewsMenu);
export default EntityViewsMenu;