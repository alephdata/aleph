import React, {Component} from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';

import { fetchEntity } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { Screen, ScreenLoading, Breadcrumbs, DualPane, Entity, ErrorScreen } from 'src/components/common';
import { EntityReferences, EntityInfo } from 'src/components/Entity/';


class EntityScreen extends Component {
  componentDidMount() {
    const { entityId } = this.props;
    this.props.fetchEntity({ id: entityId });
  }

  componentDidUpdate(prevProps) {
    const { entityId, entity } = this.props;
    if (entity.id === undefined && !entity.isLoading) {
      this.props.fetchEntity({ id: entityId });
    }
  }

  render() {
      const { entity } = this.props;
      if (entity.isError) {
        return <ErrorScreen error={entity.error}/>;
      }
      if (entity === undefined || entity.id === undefined) {
        return <ScreenLoading />;
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
            <DualPane.ContentPane>
              <EntityReferences entity={entity} />
            </DualPane.ContentPane>
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






