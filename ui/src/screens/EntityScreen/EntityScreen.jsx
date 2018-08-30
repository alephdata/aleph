import React, {Component} from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import { selectEntity, selectEntityView } from 'src/selectors';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';
import EntityReferencesMode from 'src/components/Entity/EntityReferencesMode';


class EntityScreen extends Component {
  render() {
      const { entity, entityId, mode } = this.props;
      return (
        <EntityScreenContext entityId={entityId} activeMode={mode}>
          <EntityReferencesMode entity={entity} mode={mode} />
        </EntityScreenContext>
      );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);  
  return {
    entityId,
    entity: selectEntity(state, entityId),
    mode: selectEntityView(state, entityId, hashQuery.mode, false)
  };
};

EntityScreen = connect(mapStateToProps, {})(EntityScreen);
EntityScreen = withRouter(EntityScreen);
export default EntityScreen;






