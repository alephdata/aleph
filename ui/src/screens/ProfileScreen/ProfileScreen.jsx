import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import Screen from 'components/Screen/Screen';
import EntityHeading from 'components/Entity/EntityHeading';
import EntityInfoMode from 'components/Entity/EntityInfoMode';
import ProfileViews from 'components/Profile/ProfileViews';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { Breadcrumbs, DualPane } from 'components/common';

import {
  fetchProfile,
  fetchProfileTags,
  queryEntities,
  querySimilar,
  queryProfileExpand,
  queryEntitySetItems,
} from 'actions';
import {
  selectProfile,
  selectProfileView,
  selectProfileTags,
  selectSimilarResult,
  selectProfileExpandResult,
  selectEntitySetItemsResult,
} from 'selectors';
import { profileSimilarQuery, profileReferencesQuery, entitySetItemsQuery } from 'queries';


class ProfileScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { profileId, profile, tagsResult } = this.props;

    const loadDeep = !profile?.merged?.id && !profile.isPending;
    if (profile.shouldLoad || loadDeep) {
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

  render() {
    const { profile, viaEntityId, activeMode } = this.props;

    if (profile.isError) {
      return <ErrorScreen error={profile.error} />;
    }
    if (!profile?.id || !profile?.merged) {
      return <LoadingScreen />;
    }

    const breadcrumbs = (
      <Breadcrumbs>
        <Breadcrumbs.Collection collection={profile.collection} />
        <Breadcrumbs.EntitySet key="profile" entitySet={profile} />
      </Breadcrumbs>
    );

    return (
      <Screen title={profile.label}>
        {breadcrumbs}
        <DualPane>
          <DualPane.SidePane className="ItemOverview">
            <div className="ItemOverview__heading">
              <EntityHeading entity={profile.entity} isPreview={false} />
            </div>
            <div className="ItemOverview__content">
              <EntityInfoMode entity={profile.entity} isPreview={false} />
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
      </Screen>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { profileId } = ownProps.match.params;
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
  connect(mapStateToProps, mapDispatchToProps),
)(ProfileScreen);
