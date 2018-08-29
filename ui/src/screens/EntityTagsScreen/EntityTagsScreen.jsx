import React, {Component} from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import Query from 'src/app/Query';
import { fetchEntity } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { Breadcrumbs, DualPane, Entity } from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import EntityInfoTags from "src/components/Entity/EntityInfoTags";
import { EntityInfo } from 'src/components/Entity/';
import { EntityViewsMenu } from "src/components/ViewsMenu";

class EntityTagsScreen extends Component {
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
  }

  render() {
    const { entity, query } = this.props;
    if (entity.isError) {
      return <ErrorScreen error={entity.error}/>;
    }
    if (entity === undefined || entity.id === undefined) {
      return <LoadingScreen />;
    }

    const breadcrumbs = (
      <Breadcrumbs collection={entity.collection}>
        <li>
          <Entity.Link entity={entity} className="pt-breadcrumb" icon truncate={30}/>
        </li>
      </Breadcrumbs>
    );

    return (
      <Screen breadcrumbs={breadcrumbs} title={entity.name}>
        <DualPane>
          <DualPane.ContentPane className='view-menu-flex-direction'>
            <EntityViewsMenu isActive='tags' entity={entity} isPreview={false}/>
            <EntityInfoTags entity={entity} query={query} />
          </DualPane.ContentPane>
          <EntityInfo entity={entity} />
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  const path = entityId ? `entities/${entityId}/similar` : undefined;
  const query = Query.fromLocation(path, {}, {}, 'similar').limit(75);
  return {
    entityId,
    query,
    entity: selectEntity(state, entityId),
  };
};

EntityTagsScreen = connect(mapStateToProps, { fetchEntity }, null, { pure: false })(EntityTagsScreen);
EntityTagsScreen = injectIntl(EntityTagsScreen);
export default EntityTagsScreen;
