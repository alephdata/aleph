import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { queryEntitySimilar } from 'src/queries';
import {
  fetchEntity, fetchEntityTags, fetchEntityReferences, queryEntities,
} from 'src/actions';
import {
  selectEntity, selectEntityTags, selectEntityReferences, selectEntitiesResult,
} from 'src/selectors';


class EntityScreenContext extends PureComponent {
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

    const { similarQuery, similarResult } = this.props;
    if (similarResult.shouldLoad) {
      this.props.queryEntities({ query: similarQuery });
    }
  }

  render() {
    return this.props.children;
  }
}


const mapStateToProps = (state, ownProps) => {
  const { entityId, location } = ownProps;
  const similarQuery = queryEntitySimilar(location, entityId);
  return {
    entity: selectEntity(state, entityId),
    tagsResult: selectEntityTags(state, entityId),
    referencesResult: selectEntityReferences(state, entityId),
    similarQuery,
    similarResult: selectEntitiesResult(state, similarQuery),
  };
};

const mapDispatchToProps = {
  fetchEntity, fetchEntityTags, fetchEntityReferences, queryEntities,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(EntityScreenContext);
