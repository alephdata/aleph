import React, { Component } from 'react';
import { withRouter } from 'react-router';
import queryString from 'query-string';
import { ButtonGroup } from '@blueprintjs/core';

import Screen from 'components/Screen/Screen';
import ProfileContextLoader from 'components/Profile/ProfileContextLoader';
import { compose } from 'redux';
import { connect } from 'react-redux';
import EntityHeading from 'components/Entity/EntityHeading';
import EntityInfoMode from 'components/Entity/EntityInfoMode';
import ProfileViews from 'components/Profile/ProfileViews';
import LoadingScreen from 'components/Screen/LoadingScreen';
import ErrorScreen from 'components/Screen/ErrorScreen';
import { Breadcrumbs, DualPane } from 'components/common';
import { DownloadButton } from 'components/Toolbar';
import { selectProfile, selectProfileView } from 'selectors';


class ProfileScreen extends Component {

  render() {
    const { profile, profileId, activeMode } = this.props;

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
              <ProfileViews profile={profile} activeMode={activeMode} />
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
  const hashQuery = queryString.parse(location.hash);
  return {
    profile: selectProfile(state, profileId),
    profileId,
    activeMode: selectProfileView(state, profileId, hashQuery.mode)
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(ProfileScreen);
