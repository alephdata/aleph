import React, {Component} from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { fetchEntity } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { Breadcrumbs, DualPane, Entity } from 'src/components/common';
import Screen from 'src/components/Screen/Screen';
import ErrorScreen from 'src/components/Screen/ErrorScreen';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import { EntityContent, EntityInfo } from 'src/components/Entity/';


class EntityScreen extends Component {
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
      const { entity } = this.props;
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
            <EntityContent entity={entity} />
            <EntityInfo entity={entity} />
          </DualPane>
        </Screen>
      );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  return { entityId, entity: selectEntity(state, entityId) };
};

EntityScreen = connect(mapStateToProps, { fetchEntity }, null, { pure: false })(EntityScreen);
EntityScreen = injectIntl(EntityScreen);
export default EntityScreen;






