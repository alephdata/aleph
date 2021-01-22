import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Tab, Tabs, Icon } from '@blueprintjs/core';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
  Count, Property, ResultCount, Schema, SectionLoading, TextLoading,
} from 'components/common';
import { profileSimilarQuery, profileReferenceQuery, entitySetItemsQuery } from 'queries';
import {
  selectProfileReferences, selectProfileReference, selectProfileTags, selectEntitySetItemsResult, selectSimilarResult,
} from 'selectors';
import EntityReferencesMode from 'components/Entity/EntityReferencesMode';
import ProfileSimilarMode from 'components/Profile/ProfileSimilarMode';
import ProfileItemsMode from './ProfileItemsMode';


class ProfileViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(mode) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.mode = mode;
    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      activeMode, profile, references, items, similar, reference, referenceQuery, viaEntityId
    } = this.props;
    if (references.total === undefined) {
      return <SectionLoading />;
    }

    return (
      <Tabs
        id="ProfileInfoTabs"
        onChange={this.handleTabChange}
        selectedTabId={activeMode}
        renderActiveTabPanelOnly
        className="info-tabs-padding"
      >
        <Tab
          id="items"
          title={(
            <TextLoading loading={items.total === undefined}>
              <Icon icon="layers" className="left-icon" />
              <FormattedMessage id="profile.info.items" defaultMessage="Entity decisions" />
              <ResultCount result={items} />
            </TextLoading>
          )}
          panel={
            <ProfileItemsMode
              profile={profile}
              viaEntityId={viaEntityId}
            />
          }
        />
        <Tab
          id="similar"
          disabled={similar.total === 0}
          title={(
            <TextLoading loading={similar.total === undefined}>
              <Icon icon="layer-outline" className="left-icon" />
              <FormattedMessage id="profile.info.similar" defaultMessage="Suggested" />
              <ResultCount result={similar} />
            </TextLoading>
          )}
          panel={<ProfileSimilarMode profile={profile} />}
        />
        {references.results.map(ref => (
          <Tab
            id={ref.property.qname}
            key={ref.property.qname}
            title={(
              <>
                <Schema.Icon schema={ref.schema} className="left-icon" />
                <Property.Reverse prop={ref.property} />
                <Count count={ref.count} />
              </>
            )}
            panel={
              <EntityReferencesMode
                entity={profile.entity}
                mode={activeMode}
                reference={reference}
                query={referenceQuery}
              />
            }
          />
        ))}
        {!references.total && references.isPending && (
          <Tab
            id="loading"
            title={<TextLoading loading={true} />}
          />
        )}
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { profile, location, activeMode } = ownProps;
  const reference = selectProfileReference(state, profile.id, activeMode);
  return {
    reference,
    references: selectProfileReferences(state, profile.id),
    referenceQuery: profileReferenceQuery(location, profile, reference),
    tags: selectProfileTags(state, profile.id),
    similar: selectSimilarResult(state, profileSimilarQuery(location, profile.id)),
    items: selectEntitySetItemsResult(state, entitySetItemsQuery(location, profile.id)),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(ProfileViews);
