import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Navigate } from 'react-router-dom';
import queryString from 'query-string';
import { defineMessages, injectIntl } from 'react-intl';
import { ButtonGroup, ControlGroup } from '@blueprintjs/core';

import withRouter from '/src/app/withRouter.jsx';
import Screen from '/src/components/Screen/Screen';
import EntityHeading from '/src/components/Entity/EntityHeading';
import EntityProperties from '/src/components/Entity/EntityProperties';
import ProfileViews from '/src/components/Profile/ProfileViews';
import LoadingScreen from '/src/components/Screen/LoadingScreen';
import ErrorScreen from '/src/components/Screen/ErrorScreen';
import CollectionWrapper from '/src/components/Collection/CollectionWrapper';
import EntitySetDeleteDialog from '/src/dialogs/EntitySetDeleteDialog/EntitySetDeleteDialog.jsx';
import ProfileCallout from '/src/components/Profile/ProfileCallout';
import { DialogToggleButton } from '/src/components/Toolbar';
import {
  Breadcrumbs,
  DualPane,
  Schema,
} from '/src/components/common/index.jsx';
import getEntityLink from '/src/util/getEntityLink.js';
import {
  fetchProfile,
  fetchProfileTags,
  queryEntities,
  querySimilar,
  queryProfileExpand,
  queryEntitySetItems,
} from '/src/actions/index.js';
import {
  selectProfile,
  selectProfileView,
  selectProfileTags,
  selectSimilarResult,
  selectProfileExpandResult,
  selectEntitySetItemsResult,
} from '/src/selectors.js';
import {
  profileSimilarQuery,
  profileReferencesQuery,
  entitySetItemsQuery,
} from '/src/queries.js';

const messages = defineMessages({
  delete: {
    id: 'entityset.info.delete',
    defaultMessage: 'Delete',
  },
});

class ProfileScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { profileId, profile, tagsResult } = this.props;
    if (!profileId) {
      return;
    }

    if (profile.shouldLoadDeep) {
      this.props.fetchProfile({ id: profileId });
    }

    if (tagsResult.shouldLoad) {
      this.props.fetchProfileTags({ id: profileId });
    }

    const { expandQuery, expandResult } = this.props;
    if (expandResult.shouldLoad) {
      this.props.queryProfileExpand({ query: expandQuery });
    }

    const { similarQuery, similarResult } = this.props;
    if (similarResult.shouldLoad) {
      this.props.querySimilar({ query: similarQuery });
    }

    const { itemsQuery, itemsResult } = this.props;
    if (itemsResult.shouldLoad) {
      this.props.queryEntitySetItems({ query: itemsQuery });
    }
  }

  renderOperations() {
    const { intl, profile } = this.props;
    return (
      <ControlGroup className="EntitySetManageMenu">
        {profile.writeable && (
          <ButtonGroup>
            <DialogToggleButton
              buttonProps={{
                text: intl.formatMessage(messages.delete),
                icon: 'trash',
              }}
              Dialog={EntitySetDeleteDialog}
              dialogProps={{ entitySet: profile }}
            />
          </ButtonGroup>
        )}
      </ControlGroup>
    );
  }

  render() {
    const { profile, itemsResult, viaEntityId, activeMode } = this.props;

    if (profile.isError || (!itemsResult.isPending && !itemsResult.total)) {
      if (viaEntityId) {
        return <Navigate to={getEntityLink(viaEntityId, false)} replace />;
      }
      return <ErrorScreen error={profile.error} />;
    }
    if (!profile?.id || !profile?.entity) {
      return <LoadingScreen />;
    }

    const baseEntity = profile.entity;
    const breadcrumbs = (
      <Breadcrumbs operation={this.renderOperations()}>
        <Breadcrumbs.Text>
          <Schema.Link
            schema={baseEntity.schema}
            collection={profile.collection}
            plural
          />
        </Breadcrumbs.Text>
        <Breadcrumbs.EntitySet key="profile" entitySet={profile} icon />
      </Breadcrumbs>
    );

    return (
      <Screen title={profile.label}>
        <CollectionWrapper collection={profile.collection}>
          {breadcrumbs}
          <DualPane>
            <DualPane.SidePane className="ItemOverview profile">
              <div className="ItemOverview__heading">
                <EntityHeading entity={baseEntity} isProfile={true} />
              </div>
              <div className="ItemOverview__callout">
                <ProfileCallout profile={profile} viaEntityId={viaEntityId} />
              </div>
              <div className="ItemOverview__content">
                <EntityProperties entity={baseEntity} showMetadata={false} />
              </div>
            </DualPane.SidePane>
            <DualPane.ContentPane>
              <ProfileViews
                profile={profile}
                activeMode={activeMode}
                viaEntityId={viaEntityId}
              />
            </DualPane.ContentPane>
          </DualPane>
        </CollectionWrapper>
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { profileId } = ownProps.params;
  const { location } = ownProps;
  const parsedHash = queryString.parse(location.hash);
  const similarQuery = profileSimilarQuery(location, profileId);
  const expandQuery = profileReferencesQuery(profileId);
  const itemsQuery = entitySetItemsQuery(location, profileId);
  return {
    profile: selectProfile(state, profileId),
    profileId,
    viaEntityId: parsedHash.via,
    activeMode: selectProfileView(state, profileId, parsedHash.mode),
    tagsResult: selectProfileTags(state, profileId),
    similarQuery,
    similarResult: selectSimilarResult(state, similarQuery),
    expandQuery,
    expandResult: selectProfileExpandResult(state, expandQuery),
    itemsQuery,
    itemsResult: selectEntitySetItemsResult(state, itemsQuery),
  };
};

const mapDispatchToProps = {
  queryEntities,
  querySimilar,
  queryProfileExpand,
  queryEntitySetItems,
  fetchProfile,
  fetchProfileTags,
};

export default compose(
  withRouter,
  injectIntl,
  connect(mapStateToProps, mapDispatchToProps)
)(ProfileScreen);
