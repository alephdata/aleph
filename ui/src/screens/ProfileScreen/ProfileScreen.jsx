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
  selectProfile, selectEntityReference, selectEntityView,
} from 'selectors';

import 'components/common/ItemOverview.scss';
import ProfileContextLoader from 'components/Profile/ProfileContextLoader';

// const SEARCHABLES = ['Pages', 'Folder', 'Package', 'Workbook'];


const messages = defineMessages({
  add_to: {
    id: 'entity.viewer.add_to',
    defaultMessage: 'Add to...',
  },
});

class EntityScreen extends Component {
  constructor(props) {
    super(props);

    // this.onCollectionSearch = this.onCollectionSearch.bind(this);
    // this.onSearch = this.onSearch.bind(this);
  }

  // onCollectionSearch(queryText) {
  //   const { history, entity } = this.props;
  //   const query = {
  //     q: queryText,
  //     'filter:collection_id': entity.collection.id,
  //   };
  //   history.push({
  //     pathname: '/search',
  //     search: queryString.stringify(query),
  //   });
  // }

  // onSearch(queryText, entityLink) {
  //   const { history, location, query } = this.props;
  //   const parsedHash = queryString.parse(location.hash);
  //   const newQuery = query.setString('q', queryText);
  //   parsedHash['preview:id'] = undefined;
  //   parsedHash['preview:mode'] = undefined;
  //   parsedHash.page = undefined;
  //   history.push({
  //     pathname: entityLink,
  //     search: newQuery.toLocation(),
  //     hash: queryString.stringify(parsedHash),
  //   });
  // }

  // getEntitySearchScope(entity) {
  //   if (!entity || !entity.schema) {
  //     return null;
  //   }
  //   const hasSearch = entity.schema.isAny(SEARCHABLES) && !entity.schema.isA('Email');
  //   if (!hasSearch) {
  //     return null;
  //   }
  //   const entityLink = getEntityLink(entity);
  //   return {
  //     listItem: <Entity.Label entity={entity} icon truncate={30} />,
  //     label: entity.getCaption(),
  //     onSearch: queryText => this.onSearch(queryText, entityLink),
  //   };
  // }

  // getReferenceSearchScope(entity) {
  //   const { reference } = this.props;
  //   if (!reference || reference.count < 10) {
  //     return null;
  //   }
  //   const item = (
  //     <>
  //       <Entity.Label entity={entity} icon truncate={30} />
  //       { ': '}
  //       <Property.Reverse prop={reference.property} />
  //     </>
  //   );
  //   const entityLink = getEntityLink(entity);
  //   return {
  //     listItem: item,
  //     label: reference.property.getReverse().label,
  //     onSearch: queryText => this.onSearch(queryText, entityLink),
  //   };
  // }

  // getSearchScopes() {
  //   const { entity } = this.props;
  //   const scopes = [];

  //   const referenceScope = this.getReferenceSearchScope(entity);
  //   if (referenceScope) {
  //     scopes.push(referenceScope);
  //   }

  //   let currEntity = entity;
  //   while (currEntity && EntityObject.isEntity(currEntity)) {
  //     const entityScope = this.getEntitySearchScope(currEntity);
  //     if (entityScope !== null) {
  //       scopes.push(entityScope);
  //     }
  //     currEntity = currEntity.getFirst('parent');
  //   }

  //   scopes.push({
  //     listItem: <Collection.Label collection={entity.collection} icon truncate={30} />,
  //     label: entity.collection.label,
  //     onSearch: this.onCollectionSearch,
  //   });

  //   return scopes.reverse();
  // }

  render() {
    const {
      profile, profileId, activeMode, query, isDocument, intl,
    } = this.props;

    if (profile.isError) {
      return <ErrorScreen error={profile.error} />;
    }
    if (profile.isPending || profile.shouldLoad) {
      return (
        <ProfileContextLoader profileId={profileId}>
          <LoadingScreen />
        </ProfileContextLoader>
      );
    }

    const operation = (
      <ButtonGroup>
        <DownloadButton document={profile.merged} />
      </ButtonGroup>
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection collection={profile.collection} />
        <Breadcrumbs.EntitySet key="profile" entitySet={profile} />
      </Breadcrumbs>
    );

    return (
      <ProfileContextLoader profileId={profileId}>
        <Screen title={profile.label}>
          {breadcrumbs}
          <DualPane>
            <DualPane.SidePane className="ItemOverview">
              <div className="ItemOverview__heading">
                <EntityHeading entity={profile.merged} isPreview={false} />
              </div>
              <div className="ItemOverview__content">
                <EntityInfoMode entity={profile.merged} isPreview={false} />
              </div>
            </DualPane.SidePane>
            <DualPane.ContentPane>

            </DualPane.ContentPane>
          </DualPane>
        </Screen>
      </ProfileContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { profileId } = ownProps.match.params;
  const { location } = ownProps;
  const profile = selectProfile(state, profileId);
  // const hashQuery = queryString.parse(location.hash);
  // const isDocument = entity?.schema?.isDocument();
  // const activeMode = selectEntityView(state, entityId, hashQuery.mode, false);
  // const reference = selectEntityReference(state, entityId, activeMode);
  // const referenceQuery = queryEntityReference(location, entity, reference);
  // const documentQuery = Query.fromLocation('entities', location, {}, 'document');

  return {
    profile,
    profileId,
    // reference,
    // activeMode,
    // isDocument,
    // query: referenceQuery || documentQuery,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(EntityScreen);
