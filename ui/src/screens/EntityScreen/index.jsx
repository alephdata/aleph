import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';

import Screen from 'src/components/common/Screen';
import ScreenLoading from 'src/components/common/ScreenLoading';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import EntityInfo from './EntityInfo';
import Entity from './Entity';
import EntityContent from './EntityContent';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';

const messages = defineMessages({
  not_found: {
    id: 'entity.not_found',
    defaultMessage: 'Entity not found',
  },
});

class EntityScreen extends Component {
  render() {
    const { entity } = this.props;

    if (entity.error) {
      return (
        <ErrorScreen.PageNotFound visual="error" title={messages.not_found}/>
      );
    }

    const breadcrumbs = (<Breadcrumbs collection={entity.collection}>
      <li>
        <Entity.Link entity={entity} className="pt-breadcrumb" icon truncate={30} />
      </li>
    </Breadcrumbs>);

    return (
      <Screen breadcrumbs={breadcrumbs} title={entity.name}>
        <DualPane>
          <EntityContent entity={entity} />
          <EntityInfo entity={entity} />
        </DualPane>
      </Screen>
    );
  }
}

EntityScreen = injectIntl(EntityScreen);

// Wrap the EntityScreen into Entity.Load to handle data fetching.
export default ({ match, ...otherProps }) => (
  <Entity.Load
    id={match.params.entityId}
    renderWhenLoading={<ScreenLoading />}
  >{entity => (
    <EntityScreen entity={entity} {...otherProps} />
  )}</Entity.Load>
);
