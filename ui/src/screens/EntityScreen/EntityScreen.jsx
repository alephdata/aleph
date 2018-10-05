import React, {Component} from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import { selectEntity, selectEntityView, selectSchemata } from 'src/selectors';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';
import EntityReferencesMode from 'src/components/Entity/EntityReferencesMode';
import { selectEntityReference } from "../../selectors";
import reverseLabel from 'src/util/reverseLabel';

class EntityScreen extends Component {
  render() {
      const { entity, entityId, mode, reference, schemata } = this.props;
      return (
        <EntityScreenContext entityId={entityId}
                             activeMode={mode}
                             screenTitle={reverseLabel(schemata, reference)}>
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
    mode: selectEntityView(state, entityId, hashQuery.mode, false),
    schemata: selectSchemata(state)
  };
};

EntityScreen = connect(mapStateToProps, {})(EntityScreen);
EntityScreen = withRouter(EntityScreen);
export default EntityScreen;






