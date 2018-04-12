import React, {Component} from 'react';
import {injectIntl} from 'react-intl';
import { Redirect } from 'react-router';

import { Screen, ScreenLoading, Breadcrumbs, DualPane, Entity } from 'src/components/common';
import { EntityContent, EntityInfo } from 'src/components/Entity/';
import ErrorScreen from "../../components/ErrorMessages/ErrorScreen";
import getPath from 'src/util/getPath';


class EntityScreen extends Component {
  render() {
      const {entity} = this.props;

      if (entity.error) {
        return (
          <ErrorScreen.NoTranslation title={entity.error}/>
        )
      }

      // If the entity is a document, forward to the document page.
      if (entity && entity.schemata && entity.schemata.indexOf('Document') !== -1) {
        return <Redirect to={getPath(entity.links.ui)} />
      }

      const breadcrumbs = (<Breadcrumbs collection={entity.collection}>
          <li>
              <Entity.Link entity={entity} className="pt-breadcrumb" icon truncate={30}/>
          </li>
      </Breadcrumbs>);

      return (
          <Screen breadcrumbs={breadcrumbs} title={entity.name}>
              <DualPane>
                  <EntityContent entity={entity}/>
                  <EntityInfo entity={entity}/>
              </DualPane>
          </Screen>
      );
  }
}

EntityScreen = injectIntl(EntityScreen);

// Wrap the EntityScreen into Entity.Load to handle data fetching.
export default ({match, ...otherProps}) => (
    <Entity.Load
        id={match.params.entityId}
        renderWhenLoading={<ScreenLoading/>}
    >{entity => (
        <EntityScreen entity={entity} {...otherProps} />
    )}</Entity.Load>
);
