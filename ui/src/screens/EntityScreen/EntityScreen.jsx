import React, {Component} from 'react';
import { connect } from 'react-redux';

import { selectEntity } from 'src/selectors';
import { EntityContent } from 'src/components/Entity/';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';

class EntityScreen extends Component {
  render() {
      const { entity, entityId } = this.props;
      console.log('ovdje')
      return (
        <EntityScreenContext entityId={entityId}>
          <EntityContent entity={entity} />
        </EntityScreenContext>
      );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  return { entityId, entity: selectEntity(state, entityId) };
};

EntityScreen = connect(mapStateToProps, {})(EntityScreen);
export default EntityScreen;






