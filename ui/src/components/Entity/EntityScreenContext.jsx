import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";

import Screen from 'src/components/Screen/Screen';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';
import EntityViewsMenu from 'src/components/ViewsMenu/EntityViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane } from 'src/components/common';
import { queryEntitySimilar } from 'src/queries';
import { fetchEntity, fetchEntityTags, queryEntities } from 'src/actions';
import { selectEntity, selectEntityTags, selectEntitiesResult } from 'src/selectors';


class EntityScreenContext extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
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

    const { similarQuery, similarResult } = this.props;
    if (similarResult.shouldLoad) {
      this.props.queryEntities({query: similarQuery});
    }
  }

  render() {
    const { entity, activeMode } = this.props;
    if (entity.isError) {
      return <ErrorScreen error={entity.error} />;
    }
    if (entity.shouldLoad || entity.isLoading) {
      return <LoadingScreen />;
    }

    return (
      <Screen title={entity.name}>
        <DualPane>
          <DualPane.ContentPane className='view-menu-flex-direction'>
            <EntityViewsMenu entity={entity}
                             activeMode={activeMode}
                             isPreview={false}/>
            <div>
              {this.props.children}
            </div>
          </DualPane.ContentPane>
          <DualPane.InfoPane className="with-heading">
            <EntityToolbar entity={entity} isPreview={false} />
            <EntityInfoMode entity={entity} isPreview={false} />
          </DualPane.InfoPane>
        </DualPane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { entityId, location } = ownProps;
  const similarQuery = queryEntitySimilar(location, entityId);
  return {
    entity: selectEntity(state, entityId),
    tagsResult: selectEntityTags(state, entityId),
    similarQuery: similarQuery,
    similarResult: selectEntitiesResult(state, similarQuery)
  };
};

EntityScreenContext = connect(mapStateToProps, { fetchEntity, fetchEntityTags, queryEntities })(EntityScreenContext);
EntityScreenContext = withRouter(EntityScreenContext);
export default (EntityScreenContext);
