import React, { PureComponent } from 'react';
import { Redirect } from 'react-router';
import queryString from 'query-string';

import { selectEntity, selectEntityReference, selectEntityView } from 'src/selectors';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';
import { connectedWIthRouter } from '../OAuthScreen/enhancers';

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
  };
};

export class EntityScreen extends PureComponent {
  render() {
    const { entityId, entity, mode } = this.props;
    if (entity.schemata && entity.schema.isDocument()) {
      return (
        <Redirect to={{
          ...this.props.location,
          pathname: `/documents/${entityId}`,
        }
      }
        />
      );
    }
    return <EntityScreenContext entityId={entityId} activeMode={mode} />;
  }
}

export default connectedWIthRouter({ mapStateToProps })(EntityScreen);
