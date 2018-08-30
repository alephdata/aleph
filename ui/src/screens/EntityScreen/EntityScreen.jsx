import React, {Component} from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import { selectEntity } from 'src/selectors';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';
import EntityReferencesMode from 'src/components/Entity/EntityReferencesMode';


class EntityScreen extends Component {
  render() {
      const { entity, entityId, mode } = this.props;
      console.log(entity);
      return (
        <EntityScreenContext entityId={entityId}>
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
    mode: hashQuery.mode
  };
};

EntityScreen = connect(mapStateToProps, {})(EntityScreen);
EntityScreen = withRouter(EntityScreen);
export default EntityScreen;






