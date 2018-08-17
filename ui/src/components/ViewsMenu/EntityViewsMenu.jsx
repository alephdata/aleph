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
  constructor(props) {
    super(props);

    this.onClickRelationships = this.onClickRelationships.bind(this);
    this.goToTags = this.goToTags.bind(this);
    this.onClickSimilar = this.onClickSimilar.bind(this);
  }

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

  goToTags(event, mode) {
    const {history, location, hashQuery} = this.props;
    event.preventDefault();
    hashQuery.mode = mode;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(hashQuery),
    })
  }

  onClickSimilar(event, mode) {
    const {entity, history, hashQuery} = this.props;
    event.preventDefault();
    hashQuery.mode = mode;
    history.replace({
      pathname: '/entities/' + entity.id,
      hash: queryString.stringify(hashQuery),
    })
  }

  onClickRelationships(event, reference) {
    const {entity, history} = this.props;
    event.preventDefault();
    const path = getPath(entity.links.ui);
    const tabName = 'references-' + reference.property.qname;
    const query = queryString.stringify({'mode': tabName});
    history.replace({
      pathname: path,
      hash: query
    });
  }

  render() {
    const {intl, tags, references, isFullPage} = this.props;
    const className = isFullPage ? 'ViewsMenu FullPage' : 'ViewsMenu';

    return (
      <div className={className}>
        {references.results !== undefined && references.results.map((ref) => (
          <Tooltip key={ref.property.qname} content={ref.property.reverse + ' (' + ref.count + ')'}
                   position={Position.BOTTOM_RIGHT}>
            <a key={ref.property.qname}
               onClick={(e) => this.onClickRelationships(e, ref)}
               className={c('ModeButtons', 'pt-button pt-large')}>
              <Schema.Icon schema={ref.schema}/>
            </a></Tooltip>
        ))}
        <Tooltip content={intl.formatMessage(messages.similar)} position={Position.BOTTOM_RIGHT}><a
          onClick={(e) => this.onClickSimilar(e, 'similar')}
          className={c('ModeButtons', 'pt-button pt-large')}>
          <i className="fa fa-fw fa-tags"/> {/* change icon for similar, we don't have it right now */}
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