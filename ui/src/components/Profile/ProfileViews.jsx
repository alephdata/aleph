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
import { profileSimilarQuery } from 'queries';
import {
    selectEntitiesResult, selectProfileReferences, selectProfileTags,
} from 'selectors';
import EntityReferencesMode from 'components/Entity/EntityReferencesMode';
import EntitySimilarMode from 'components/Entity/EntitySimilarMode';


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
            activeMode, profile, references, similar
        } = this.props;
        if (references.isPending) {
            return <SectionLoading />;
        }

        console.log(references);

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
                        <TextLoading loading={similar.isPending}>
                            <Icon icon="similar" className="left-icon" />
                            <FormattedMessage id="profile.info.items" defaultMessage="Components" />
                            <ResultCount result={similar} />
                        </TextLoading>
                    )}
                    panel={<EntitySimilarMode entity={profile.merged} />}
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
                            <EntityReferencesMode entity={profile.merged} mode={activeMode} />
                        }
                    />
                ))}
            </Tabs>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const { profile, location } = ownProps;
    return {
        references: selectProfileReferences(state, profile.id),
        tags: selectProfileTags(state, profile.id),
        similar: selectEntitiesResult(state, profileSimilarQuery(location, profile.id)),
    };
};

export default compose(
    withRouter,
    connect(mapStateToProps),
)(ProfileViews);
