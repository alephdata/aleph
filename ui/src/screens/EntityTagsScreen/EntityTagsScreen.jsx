import React, { Component } from 'react';
import { connect } from 'react-redux';

import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';
import { selectEntity } from 'src/selectors';


class EntityTagsScreen extends Component {
  render() {
    const { entityId, entity } = this.props;
    return (
      <EntityScreenContext entityId={entityId} activeMode='tags' subtitle='Tags'>
        <EntityTagsMode entity={entity} />
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

EntityTagsScreen = connect(mapStateToProps, {})(EntityTagsScreen);
export default EntityTagsScreen;