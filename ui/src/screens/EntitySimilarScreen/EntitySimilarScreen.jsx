import React, { Component } from 'react';
import { connect } from 'react-redux';

import { selectEntity } from 'src/selectors';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';


class EntitySimilarScreen extends Component {
  render() {
    const { entityId, entity } = this.props;
    return (
      <EntityScreenContext entityId={entityId} activeMode='similar' subtitle='Similar'>
        <EntitySimilarMode entity={entity} />
      </EntityScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  return {
    entityId,
    entity: selectEntity(state, entityId)
  };
};

EntitySimilarScreen = connect(mapStateToProps, {})(EntitySimilarScreen);
export default EntitySimilarScreen;