import React from 'react';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages } from 'react-intl';
import queryString from "query-string";
import { connect } from "react-redux";

import { fetchEntityReferences, fetchEntityTags } from "src/actions";
import { selectEntityReferences, selectEntityTags, selectMetadata } from "src/selectors";
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
    const {intl, references, isPreview, mode, entity, isActive} = this.props;
    const { metadata } = this.props;
    const { schemata } = metadata;
    const className = !isPreview ? 'ViewsMenu FullPage' : 'ViewsMenu';

    return (
      <div className={className}>
        {references.results !== undefined && references.results.map((ref) => (
          <ViewItem
            message={ref.property.reverse + ' (' + ref.count + ')'}
            key={ref.property.qname}
            isPreview={true}
            mode={ref.property.qname}
            onClick={this.onClickReference}
            isActive={mode === 'references-' + ref.property.qname}
            icon={schemata[ref.schema].icon}
            />
        ))}
        <ViewItem
          message={intl.formatMessage(messages.similar)}
          isPreview={false}
          mode='similar'
          href={'/entities/' + entity.id + '/similar'}
          isActive={isActive === 'similar'}
          icon='fa-repeat' />
        <ViewItem
          message={intl.formatMessage(messages.tags)}
          isPreview={false}
          mode='tags'
          href={'/entities/' + entity.id + '/tags'}
          isActive={isActive === 'tags'}
          icon='fa-tags' />
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
    metadata: selectMetadata(state)
  };
};

EntityViewsMenu = connect(mapStateToProps, {
  fetchEntityReferences,
  fetchEntityTags
})(EntityViewsMenu);
EntityViewsMenu = injectIntl(EntityViewsMenu);
EntityViewsMenu = withRouter(EntityViewsMenu);
export default EntityViewsMenu;