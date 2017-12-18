import React, { Component } from 'react';
import { connect } from 'react-redux';

import { fetchEntity } from 'src/actions';
import DualPane from 'src/components/common/DualPane';
import EntityInfo from './EntityInfo';
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
    if (entity === undefined || entity._isFetching) {
      return (
        <span>Loading entity..</span>
      );
    }
    return (
      <DualPane>
        <EntityInfo entity={entity} />
        <EntityContent entity={entity} />
      </DualPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  const entity = entityId !== undefined ? state.entityCache[entityId] : undefined;
  return { entityId, entity };
}

export default connect(mapStateToProps, { fetchEntity })(EntityScreen);
