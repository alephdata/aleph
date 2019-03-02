import React, { Component } from 'react';
import Helmet from 'react-helmet';

import Screen from 'src/components/Screen/Screen';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';
import EntityViews from 'src/components/Entity/EntityViews';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane, Breadcrumbs } from 'src/components/common';
import { selectEntity, selectSchemata } from 'src/selectors';
import { connectedWithRouter } from 'src/util/enhancers';

class EntityScreenContext extends Component {
  getKeywords() {
    if (this.props.entity) {
      return this.props.entity
        .getProperties()
        .filter(property => property.name !== 'description')
        .map(property => property.toString(' '))
        .join(' ');
    }
    return undefined;
  }

  render() {
    const { entity, entityId, activeMode } = this.props;
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
    const breadcrumbs = (
      <Breadcrumbs>
        <Breadcrumbs.Collection collection={entity.collection} />
        <Breadcrumbs.Entity entity={entity} />
      </Breadcrumbs>
    );
    const keywords = this.getKeywords();
    return (
      <EntityContextLoader entityId={entityId}>
        <Screen title={entity.name}>
          <Helmet>
            <meta name="keywords" content={keywords} />
            <meta name="description" content={entity.getProperty('description').toString(' ')} />
          </Helmet>
          {breadcrumbs}
          <DualPane>
`
            <DualPane.ContentPane className="view-menu-flex-direction">
              <EntityViews
                entity={entity}
                activeMode={activeMode}
                isPreview={false}
              />
            </DualPane.ContentPane>
            <DualPane.InfoPane className="with-heading">
              <EntityToolbar entity={entity} isPreview={false} />
              <EntityHeading entity={entity} isPreview={false} />
              <div className="pane-content">
                <EntityInfoMode entity={entity} isPreview={false} />
              </div>
            </DualPane.InfoPane>
          </DualPane>
        </Screen>
      </EntityContextLoader>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps;
  const entity = selectEntity(state, entityId);
  return { entity, schemata: selectSchemata(state) };
};


export default connectedWithRouter({
  mapStateToProps,
})(EntityScreenContext);
