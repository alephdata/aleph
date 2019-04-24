import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
  fetchEntity, fetchDocumentContent, fetchEntityTags, fetchEntityReferences, queryEntities,
} from 'src/actions';
import {
  selectEntity, selectEntityTags, selectEntityReferences,
  selectEntitiesResult, selectDocumentContent,
} from 'src/selectors';
import { queryEntitySimilar, queryFolderDocuments } from 'src/queries';


class EntityContextLoader extends PureComponent {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entityId, entity } = this.props;
    if (entity.shouldLoad) {
      this.props.fetchEntity({ id: entityId });
    }

    const { tagsResult } = this.props;
    if (tagsResult.shouldLoad) {
      this.props.fetchEntityTags({ id: entityId });
    }

    const { referencesResult } = this.props;
    if (referencesResult.shouldLoad) {
      this.props.fetchEntityReferences({ id: entityId });
    }

    if (entity && entity.schema && entity.schema.name) {
      this.fetchWithSchema(entityId, entity.schema);
    }
  }

  fetchWithSchema(entityId, schema) {
    const { content } = this.props;
    if (schema.isDocument() && content.shouldLoad) {
      this.props.fetchDocumentContent({ id: entityId });
    }

    const { similarQuery, similarResult } = this.props;
    if (schema.matchable && similarResult.shouldLoad) {
      this.props.queryEntities({ query: similarQuery });
    }

    const { childrenResult, childrenQuery } = this.props;
    if (schema.isA('Folder') && childrenResult.shouldLoad) {
      this.props.queryEntities({ query: childrenQuery });
    }
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { entityId, location } = ownProps;
  const similarQuery = queryEntitySimilar(location, entityId);
  const childrenQuery = queryFolderDocuments(location, entityId, undefined);
  return {
    entity: selectEntity(state, entityId),
    content: selectDocumentContent(state, entityId),
    tagsResult: selectEntityTags(state, entityId),
    referencesResult: selectEntityReferences(state, entityId),
    similarQuery,
    similarResult: selectEntitiesResult(state, similarQuery),
    childrenQuery,
    childrenResult: selectEntitiesResult(state, childrenQuery),
  };
};

const mapDispatchToProps = {
  queryEntities,
  fetchEntity,
  fetchEntityTags,
  fetchEntityReferences,
  fetchDocumentContent,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(EntityContextLoader);
