import React from 'react';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages } from 'react-intl';
import queryString from "query-string";
import { connect } from "react-redux";

import { queryEntitySimilar } from 'src/queries';
import { fetchEntityReferences } from "src/actions";
import { selectEntityReferences, selectEntityTags, selectMetadata, selectEntitiesResult } from "src/selectors";
import getPath from "src/util/getPath";
import ViewItem from "src/components/ViewsMenu/ViewItem";

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
    this.onClickReference = this.onClickReference.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const {entity, references} = this.props;
    if (entity.id !== undefined) {
      if (references.shouldLoad) {
        this.props.fetchEntityReferences(entity);
      }
    }
  }

  onClickReference(event, mode) {
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
    const {intl, isPreview, activeMode, entity} = this.props;
    const { references, tags, similar } = this.props;
    const { metadata } = this.props;
    const { schemata } = metadata;
    const className = !isPreview ? 'ViewsMenu FullPage' : 'ViewsMenu';

    return (
      <div className={className}>
        {references.results !== undefined && references.results.map((ref) => (
          <ViewItem mode={ref.property.qname} activeMode={activeMode} isPreview={isPreview}
            message={ref.property.reverse + ' (' + ref.count + ')'}
            key={ref.property.qname}
            onClick={this.onClickReference}
            icon={schemata[ref.schema].icon} />
        ))}
        <ViewItem mode='similar' activeMode={activeMode} isPreview={isPreview}
          disabled={similar.total === 0}
          message={intl.formatMessage(messages.similar)}
          href={'/entities/' + entity.id + '/similar'}
          icon='fa-repeat' />
        <ViewItem mode='tags' activeMode={activeMode} isPreview={isPreview}
          disabled={tags.total === 0}
          message={intl.formatMessage(messages.tags)}
          href={'/entities/' + entity.id + '/tags'}
          icon='fa-tags' />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location } = ownProps;
  return {
    references: selectEntityReferences(state, entity.id),
    metadata: selectMetadata(state),
    tags: selectEntityTags(state, entity.id),
    similar: selectEntitiesResult(state, queryEntitySimilar(location, entity.id))
  };
};

EntityViewsMenu = connect(mapStateToProps, { fetchEntityReferences })(EntityViewsMenu);
EntityViewsMenu = injectIntl(EntityViewsMenu);
EntityViewsMenu = withRouter(EntityViewsMenu);
export default EntityViewsMenu;