import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { ButtonGroup } from '@blueprintjs/core';

import Screen from '/src/components/Screen/Screen';
import EntityContextLoader from '/src/components/Entity/EntityContextLoader';
import EntityHeading from '/src/components/Entity/EntityHeading';
import EntityProperties from '/src/components/Entity/EntityProperties';
import EntityViews from '/src/components/Entity/EntityViews';
import EntityDeleteButton from '/src/components/Toolbar/EntityDeleteButton';
import LoadingScreen from '/src/components/Screen/LoadingScreen';
import ErrorScreen from '/src/components/Screen/ErrorScreen';
import EntitySetSelector from '/src/components/EntitySet/EntitySetSelector';
import CollectionWrapper from '/src/components/Collection/CollectionWrapper';
import ProfileCallout from '/src/components/Profile/ProfileCallout';
import {
  BookmarkButton,
  Breadcrumbs,
  DualPane,
  Schema,
} from '/src/components/common/index.jsx';
import { DialogToggleButton } from '/src/components/Toolbar';
import { DownloadButton } from '/src/components/Toolbar';
import { deleteEntity } from '/src/actions/index.js';
import { selectEntity, selectEntityView } from '/src/selectors.js';
import getProfileLink from '/src/util/getProfileLink.js';
import { setRecentlyViewedItem } from '/src/app/storage';
import withRouter from '/src/app/withRouter.jsx';

import '/src/components/common/ItemOverview.scss';

const messages = defineMessages({
  add_to: {
    id: 'entity.viewer.add_to',
    defaultMessage: 'Add to...',
  },
});

class EntityScreen extends Component {
  constructor(props) {
    super(props);
    this.onUnmount = this.onUnmount.bind(this);
  }

  componentDidMount() {
    this.cleanHash();
    window.addEventListener('beforeunload', this.onUnmount);
  }

  componentDidUpdate() {
    this.cleanHash();
  }

  componentWillUnmount() {
    this.onUnmount();
    window.removeEventListener('beforeunload', this.onUnmount);
  }

  onUnmount() {
    const { entityId } = this.props;
    setRecentlyViewedItem(entityId);
  }

  cleanHash() {
    const { entity, navigate, location, parsedHash } = this.props;

    // if an entity does not have an associated profile, ensure profile=false is removed from hash
    if (!!entity.id && !entity.profileId && !!parsedHash.profile) {
      delete parsedHash.profile;

      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: queryString.stringify(parsedHash),
        },
        { replace: true }
      );
    }
  }

  render() {
    const { entity, entityId, intl, parsedHash } = this.props;
    if (entity.profileId && parsedHash.profile === undefined) {
      parsedHash.via = entity.id;
      return (
        <Navigate to={getProfileLink(entity.profileId, parsedHash)} replace />
      );
    }

    if (entity.isError) {
      return <ErrorScreen error={entity.error} />;
    }

    if (entity.id === undefined || !entity.collection) {
      return (
        <EntityContextLoader entityId={entityId}>
          <LoadingScreen />
        </EntityContextLoader>
      );
    }

    const operation = (
      <ButtonGroup>
        <BookmarkButton entity={entity} />
        <DownloadButton document={entity} />
        {entity?.collection?.writeable && (
          <>
            <DialogToggleButton
              buttonProps={{
                text: intl.formatMessage(messages.add_to),
                icon: 'add-to-artifact',
              }}
              Dialog={EntitySetSelector}
              dialogProps={{
                collection: entity.collection,
                entities: [entity],
                showTimelines: entity.schema.isA('Interval'),
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
        <Breadcrumbs.Text>
          <Schema.Link
            schema={entity.schema}
            collection={entity.collection}
            plural
          />
        </Breadcrumbs.Text>
        <Breadcrumbs.Entity entity={entity} />
      </Breadcrumbs>
    );

    return (
      <EntityContextLoader entityId={entityId}>
        <Screen title={entity.getCaption()}>
          <CollectionWrapper
            collection={entity.collection}
            dropzoneFolderParent={entity.schema.isA('Folder') && entity}
          >
            {breadcrumbs}
            <DualPane>
              <DualPane.SidePane className="ItemOverview">
                <div className="ItemOverview__heading">
                  <EntityHeading entity={entity} isPreview={false} />
                </div>
                {entity.profileId && (
                  <div className="ItemOverview__callout">
                    <ProfileCallout entity={entity} />
                  </div>
                )}
                <div className="ItemOverview__content">
                  <EntityProperties entity={entity} isPreview={false} />
                </div>
              </DualPane.SidePane>
              <DualPane.ContentPane>
                <EntityViews
                  entity={entity}
                  activeMode={parsedHash.mode}
                  isPreview={false}
                />
              </DualPane.ContentPane>
            </DualPane>
          </CollectionWrapper>
        </Screen>
      </EntityContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, params } = ownProps;
  const { entityId } = params;
  const entity = selectEntity(state, entityId);
  const parsedHash = queryString.parse(location.hash);
  parsedHash.mode = selectEntityView(state, entityId, parsedHash.mode, false);
  return { entity, entityId, parsedHash };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { deleteEntity }),
  injectIntl
)(EntityScreen);
