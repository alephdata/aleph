import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
  fetchEntity, fetchEntityTags, queryEntities, queryEntityExpand,
} from 'actions';
import {
  selectEntity, selectEntityTags, selectEntitiesResult, selectEntityExpandResult
} from 'selectors';
import { queryEntitySimilar, queryFolderDocuments, queryEntityReferences } from 'queries';


class EntityContextLoader extends PureComponent {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entityId, entity, tagsResult } = this.props;

    const loadDeep = entity.shallow && !entity.isPending;
    if (entity.shouldLoad || loadDeep) {
      this.props.fetchEntity({ id: entityId });
    }

    if (tagsResult.shouldLoad) {
      this.props.fetchEntityTags({ id: entityId });
    }

    const { expandQuery, expandResult } = this.props;
    if (expandResult.shouldLoad) {
      this.props.queryEntityExpand({ query: expandQuery });
    }

    const { similarQuery, similarResult } = this.props;
    if (entity?.schema?.matchable && similarResult.shouldLoad) {
      this.props.queryEntities({ query: similarQuery });
    }

    const { childrenResult, childrenQuery } = this.props;
    if (entity?.schema?.isA('Folder') && childrenResult.shouldLoad) {
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
  const expandQuery = queryEntityReferences(entityId);
  return {
    entity: selectEntity(state, entityId),
    tagsResult: selectEntityTags(state, entityId),
    similarQuery,
    similarResult: selectEntitiesResult(state, similarQuery),
    expandQuery,
    expandResult: selectEntityExpandResult(state, expandQuery),
    childrenQuery,
    childrenResult: selectEntitiesResult(state, childrenQuery),
  };
};

const mapDispatchToProps = {
  queryEntities,
  queryEntityExpand,
  fetchEntity,
  fetchEntityTags,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(EntityContextLoader);
