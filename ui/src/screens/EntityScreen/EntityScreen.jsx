import React, { Component } from 'react';
import { withRouter, Redirect } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';

import { selectEntity, selectEntityReference, selectEntityView } from 'src/selectors';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';

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

@connect(mapStateToProps)
@withRouter
export default class EntityScreen extends Component {
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
