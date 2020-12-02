import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import EntitySearch from 'components/EntitySearch/EntitySearch';
import { ErrorSection } from 'components/common';
import { entitySimilarQuery } from 'queries';

const messages = defineMessages({
    empty: {
        id: 'entity.similar.empty',
        defaultMessage: 'There are no similar entities.',
    },
});


class ProfileItemsMode extends Component {
    render() {
        const { intl } = this.props;
        const emptyComponent = (
            <ErrorSection
                icon="snowflake"
                title={intl.formatMessage(messages.empty)}
            />
        );
        return (
            <EntitySearch
                query={this.props.query}
                emptyComponent={emptyComponent}
                foundTextGenerator={
                    ({ resultCount, datasetCount }) => (
                        <FormattedMessage
                            id="entity.similar.found_text"
                            defaultMessage={`Found {resultCount}
                {resultCount, plural, one {similar entity} other {similar entities}}
                from {datasetCount}
                {datasetCount, plural, one {dataset} other {datasets}}
              `}
                            values={{ resultCount, datasetCount }}
                        />
                    )
                }
            />
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const { profile, location } = ownProps;
    return { query: entitySimilarQuery(location, profile.id) };
};

ProfileItemsMode = connect(mapStateToProps, {})(ProfileItemsMode);
ProfileItemsMode = withRouter(ProfileItemsMode);
ProfileItemsMode = injectIntl(ProfileItemsMode);
export default ProfileItemsMode;
