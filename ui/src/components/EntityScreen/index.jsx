import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { NonIdealState } from '@blueprintjs/core';

import { fetchEntity } from 'src/actions';
import Screen from 'src/components/common/Screen';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import EntityInfo from './EntityInfo';
import Entity from './Entity';
import EntityContent from './EntityContent';


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
    if (entity.error) {
      return (
        <NonIdealState visual="error" title="Entity not found" />
      );
    }
    return (
      <Screen>
        <Helmet>
          <title>{entity.name}</title>
        </Helmet>
        <Breadcrumbs collection={entity.collection}>
          <li>
            <Entity.Link entity={entity} className="pt-breadcrumb" icon truncate={30} />
          </li>
        </Breadcrumbs>
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
  const entity = entityId !== undefined ? state.entities[entityId] : undefined;
  return { entityId, entity };
}

export default connect(mapStateToProps, { fetchEntity })(EntityScreen);
