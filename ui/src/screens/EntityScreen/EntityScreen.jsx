import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup } from '@blueprintjs/core';
import { Entity as EntityObject } from '@alephdata/followthemoney';

import Query from 'app/Query';
import Screen from 'components/Screen/Screen';
import EntityContextLoader from 'components/Entity/EntityContextLoader';
import { compose } from 'redux';
import { connect } from 'react-redux';
import EntityHeading from 'components/Entity/EntityHeading';
import EntityInfoMode from 'components/Entity/EntityInfoMode';
import EntityViews from 'components/Entity/EntityViews';
import EntityDeleteButton from 'components/Toolbar/EntityDeleteButton';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import { Breadcrumbs, Collection, DualPane, Entity, Property } from 'components/common';
import { DialogToggleButton } from 'components/Toolbar';
import { DownloadButton } from 'components/Toolbar';
import getEntityLink from 'util/getEntityLink';
import { deleteEntity } from 'actions';
import { queryEntityReference } from 'queries';
import {
  selectEntity, selectEntityReference, selectEntityView,
} from 'selectors';

import 'components/common/ItemOverview.scss';

const SEARCHABLES = ['Pages', 'Folder', 'Package', 'Workbook'];


const messages = defineMessages({
  add_to: {
    id: 'entity.viewer.add_to',
    defaultMessage: 'Add to...',
  },
});

class EntityScreen extends Component {
  constructor(props) {
    super(props);

    this.onCollectionSearch = this.onCollectionSearch.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  onCollectionSearch(queryText) {
    const { history, entity } = this.props;
    const query = {
      q: queryText,
      'filter:collection_id': entity.collection.id,
    };
    history.push({
      pathname: '/search',
      search: queryString.stringify(query),
    });
  }

  onSearch(queryText, entityLink) {
    const { history, location, query } = this.props;
    const parsedHash = queryString.parse(location.hash);
    const newQuery = query.setString('q', queryText);
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:mode'] = undefined;
    parsedHash.page = undefined;
    history.push({
      pathname: entityLink,
      search: newQuery.toLocation(),
      hash: queryString.stringify(parsedHash),
    });
  }

  getEntitySearchScope(entity) {
    if (!entity || !entity.schema) {
      return null;
    }
    const hasSearch = entity.schema.isAny(SEARCHABLES) && !entity.schema.isA('Email');
    if (!hasSearch) {
      return null;
    }
    const entityLink = getEntityLink(entity);
    return {
      listItem: <Entity.Label entity={entity} icon truncate={30} />,
      label: entity.getCaption(),
      onSearch: queryText => this.onSearch(queryText, entityLink),
    };
  }

  getReferenceSearchScope(entity) {
    const { reference } = this.props;
    if (!reference || reference.count < 10) {
      return null;
    }
    const item = (
      <>
        <Entity.Label entity={entity} icon truncate={30} />
        { ': '}
        <Property.Reverse prop={reference.property} />
      </>
    );
    const entityLink = getEntityLink(entity);
    return {
      listItem: item,
      label: reference.property.getReverse().label,
      onSearch: queryText => this.onSearch(queryText, entityLink),
    };
  }

  getSearchScopes() {
    const { entity } = this.props;
    const scopes = [];

    const referenceScope = this.getReferenceSearchScope(entity);
    if (referenceScope) {
      scopes.push(referenceScope);
    }

    let currEntity = entity;
    while (currEntity && EntityObject.isEntity(currEntity)) {
      const entityScope = this.getEntitySearchScope(currEntity);
      if (entityScope !== null) {
        scopes.push(entityScope);
      }
      currEntity = currEntity.getFirst('parent');
    }

    scopes.push({
      listItem: <Collection.Label collection={entity.collection} icon truncate={30} />,
      label: entity.collection.label,
      onSearch: this.onCollectionSearch,
    });

    return scopes.reverse();
  }

  render() {
    const {
      entity, entityId, activeMode, query, isDocument, intl,
    } = this.props;

    if (entity.isError) {
      return <ErrorScreen error={entity.error} />;
    }
    if (entity.id === undefined) {
      return (
        <EntityContextLoader entityId={entityId}>
          <LoadingScreen />
        </EntityContextLoader>
      );
    }

    const showDownloadButton = isDocument && entity && entity.links && entity.links.file;
    const { writeable } = entity.collection;

    const operation = (
      <ButtonGroup>
        {showDownloadButton && <DownloadButton document={entity} />}
        {writeable && (
          <>
            <DialogToggleButton
              buttonProps={{
                text: intl.formatMessage(messages.add_to),
                icon: "add-to-artifact"
              }}
              Dialog={EntitySetSelector}
              dialogProps={{
                collection: entity.collection,
                entities: [entity]
              }}
            />
            <EntityDeleteButton
              entities={[entity]}
              redirectOnSuccess
              actionType="delete"
              deleteEntity={this.props.deleteEntity}
            />
          </>
        )}
      </ButtonGroup>
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection collection={entity.collection} />
        <Breadcrumbs.Entity entity={entity} />
      </Breadcrumbs>
    );

    return (
      <EntityContextLoader entityId={entityId}>
        <Screen title={entity.getCaption()} searchScopes={this.getSearchScopes()} query={query}>
          {breadcrumbs}
          <DualPane>
            <DualPane.SidePane className="ItemOverview">
              <div className="ItemOverview__heading">
                <EntityHeading entity={entity} isPreview={false} />
              </div>
              <div className="ItemOverview__content">
                <EntityInfoMode entity={entity} isPreview={false} />
              </div>
            </DualPane.SidePane>
            <DualPane.ContentPane>
              <EntityViews
                entity={entity}
                activeMode={activeMode}
                isPreview={false}
              />
            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      </EntityContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  const { location } = ownProps;
  const entity = selectEntity(state, entityId);
  const hashQuery = queryString.parse(location.hash);
  const isDocument = entity?.schema?.isDocument();
  const activeMode = selectEntityView(state, entityId, hashQuery.mode, false);
  const reference = selectEntityReference(state, entityId, activeMode);
  const referenceQuery = queryEntityReference(location, entity, reference);
  const documentQuery = Query.fromLocation('entities', location, {}, 'document');

  return {
    entity,
    entityId,
    reference,
    activeMode,
    isDocument,
    query: referenceQuery || documentQuery,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { deleteEntity }),
  injectIntl,
)(EntityScreen);
