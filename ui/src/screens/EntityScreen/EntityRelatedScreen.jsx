import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import { fetchEntity } from 'src/actions';
import Screen from 'src/components/common/Screen';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import EntityInfo from './EntityInfo';
import Entity from './Entity';
import EntitySearch from 'src/components/EntitySearch/EntitySearch';


class EntityScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entityId, entity } = this.props;
    if (entity === undefined) {
      this.props.fetchEntity({ id: entityId });
    }
  }

  render() {
    const { entity } = this.props;
    if (entity === undefined || entity.isFetching) {
      return <ScreenLoading />;
    }
    const context = { exclude: entity.id };
    const breadcrumbs = (
      <Breadcrumbs collection={entity.collection}>
        <li>
          <Entity.Link entity={entity} className="pt-breadcrumb" icon truncate={30} />
        </li>
        <li>
          <a className="pt-breadcrumb">
            <FormattedMessage id="entity.related" defaultMessage="Related"/>
          </a>
        </li>
      </Breadcrumbs>
    );

    return (
      <Screen title={entity.name} breadcrumbs={breadcrumbs}>
        <DualPane>
          <DualPane.ContentPane>
            <EntitySearch context={context} />
          </DualPane.ContentPane>
          <EntityInfo entity={entity} />
        </DualPane>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  const entity = entityId !== undefined ? state.entities[entityId] : undefined;
  return { entityId, entity };
}

export default connect(mapStateToProps, { fetchEntity })(EntityScreen);
