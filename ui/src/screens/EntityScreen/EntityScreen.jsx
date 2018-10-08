import React, {Component} from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import { selectEntity, selectEntityView } from 'src/selectors';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';
import EntityReferencesMode from 'src/components/Entity/EntityReferencesMode';
import { selectEntityReference } from "../../selectors";

class EntityScreen extends Component {
  render() {
      const { entity, entityId, mode, reference } = this.props;
      return (
        <EntityScreenContext entityId={entityId} activeMode={mode} subtitle={reference !== undefined ? reference.property.reverse + ' (' + reference.count + ')' : ''}>
          <EntityReferencesMode entity={entity} mode={mode} />
        </EntityScreenContext>
      );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId, mode } = ownProps.match.params;
  const { location } = ownProps;
  const reference = selectEntityReference(state, entityId, mode);
  const hashQuery = queryString.parse(location.hash);  
  return {
    entityId,
    reference,
    entity: selectEntity(state, entityId),
    mode: selectEntityView(state, entityId, hashQuery.mode, false)
  };
};

EntityScreen = connect(mapStateToProps, {})(EntityScreen);
EntityScreen = withRouter(EntityScreen);
export default EntityScreen;






