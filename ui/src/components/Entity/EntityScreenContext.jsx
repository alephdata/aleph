import React, { Component } from 'react';
import { connect } from 'react-redux';

import Screen from 'src/components/Screen/Screen';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';
import EntityViewsMenu from 'src/components/ViewsMenu/EntityViewsMenu';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import { DualPane } from 'src/components/common';
import { selectEntity } from 'src/selectors';


class EntityScreenContext extends Component {
  render() {
    const { entity, entityId, activeMode } = this.props;
    if (entity.isError) {
      return <ErrorScreen error={entity.error} />;
    }
    if (entity.shouldLoad || entity.isLoading) {
      return <LoadingScreen />;
    }
    return (
      <EntityContextLoader entityId={entityId}>
        <Screen title={entity.name}>
          <DualPane>
            <DualPane.ContentPane className='view-menu-flex-direction'>
              <EntityViewsMenu entity={entity} activeMode={activeMode} isPreview={false}/>
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
      </EntityContextLoader>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps;
  return { entity: selectEntity(state, entityId) };
};

EntityScreenContext = connect(mapStateToProps, {})(EntityScreenContext);
export default (EntityScreenContext);
