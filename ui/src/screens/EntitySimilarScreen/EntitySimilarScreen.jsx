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
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import { EntityInfo } from 'src/components/Entity/';
import { EntityViewsMenu } from "src/components/ViewsMenu";

import './EntitySimilarScreen.css';

class EntitySimilarScreen extends Component {
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
            <DualPane.ContentPane className='EntitySimilarScreen'>
              <EntityViewsMenu isActive='similar' entity={entity} isPreview={false}/>
              <EntitySimilarMode entity={entity} query={query} />
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

EntitySimilarScreen = connect(mapStateToProps, { fetchEntity }, null, { pure: false })(EntitySimilarScreen);
EntitySimilarScreen = injectIntl(EntitySimilarScreen);
export default EntitySimilarScreen;
