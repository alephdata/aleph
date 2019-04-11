import React, { Component } from 'react';
import { Redirect } from 'react-router';
import queryString from 'query-string';

import Screen from 'src/components/Screen/Screen';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
// import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';
import EntityViews from 'src/components/Entity/EntityViews';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs } from 'src/components/common';
import {
  selectEntity, selectEntityReference, selectEntityView,
} from 'src/selectors';
import { connectedWithRouter } from 'src/util/enhancers';


class EntityScreen extends Component {
  render() {
    const {
      entity, entityId, activeMode, location,
    } = this.props;
    if (entity.isError) {
      return <ErrorScreen error={entity.error} />;
    }
    if (entity.shouldLoad || entity.isLoading) {
      return (
        <EntityContextLoader entityId={entityId}>
          <LoadingScreen />
        </EntityContextLoader>
      );
    }
    if (entity.schema.isDocument()) {
      return (
        <Redirect to={{ ...location, pathname: `/documents/${entityId}` }} />
      );
    }
    const breadcrumbs = (
      <Breadcrumbs>
        <Breadcrumbs.Collection collection={entity.collection} />
        <Breadcrumbs.Entity entity={entity} />
      </Breadcrumbs>
    );
    const description = entity.getProperty('description').toString(' ');
    return (
      <EntityContextLoader entityId={entityId}>
        <Screen title={entity.name} description={description}>
          {breadcrumbs}
          <DualPane>
            <DualPane.InfoPane className="with-heading">
              <EntityHeading entity={entity} isPreview={false} />
              <div className="pane-content">
                <EntityInfoMode entity={entity} isPreview={false} />
              </div>
            </DualPane.InfoPane>
            <DualPane.ContentPane>
              <EntityViews
                entity={entity}
                activeMode={activeMode}
                isPreview={false}
              />
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      </EntityContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId, mode } = ownProps.match.params;
  const { location } = ownProps;
  const reference = selectEntityReference(state, entityId, mode);
  const hashQuery = queryString.parse(location.hash);
  return {
    entityId,
    reference,
    entity: selectEntity(state, entityId),
    activeMode: selectEntityView(state, entityId, hashQuery.mode, false),
  };
};

export default connectedWithRouter({ mapStateToProps })(EntityScreen);
