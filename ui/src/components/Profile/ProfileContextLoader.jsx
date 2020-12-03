import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
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
    selectProfileTags,
    selectSimilarResult,
    selectProfileExpandResult,
    selectEntitySetItemsResult,
} from 'selectors';
import { profileSimilarQuery, profileReferencesQuery, entitySetItemsQuery } from 'queries';


class ProfileContextLoader extends PureComponent {
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
        return this.props.children;
    }
}


const mapStateToProps = (state, ownProps) => {
    const { profileId, location } = ownProps;
    const similarQuery = profileSimilarQuery(location, profileId);
    const expandQuery = profileReferencesQuery(profileId);
    const itemsQuery = entitySetItemsQuery(location, profileId);
    return {
        profile: selectProfile(state, profileId),
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
)(ProfileContextLoader);
