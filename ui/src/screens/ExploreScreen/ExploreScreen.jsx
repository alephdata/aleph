import React, { Component } from 'react';
import { withRouter } from 'react-router';
import Screen from 'src/components/Screen/Screen';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import Explore from 'src/components/Entity/Explore';


export class ExploreScreen extends Component {
  render() {
    const { entityId } = this.props.match.params;
    const vis2 = <Explore entityId={entityId} />;
    return (
      <Screen>
        {entityId ? (
          <EntityContextLoader entityId={entityId}>
            {vis2}
          </EntityContextLoader>
        ) : vis2}
      </Screen>
    );
  }
}

export default withRouter(ExploreScreen);
