import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
    fetchProfile,
    fetchProfileTags,
} from 'actions';
import {
    selectProfile,
    selectProfileTags,
} from 'selectors';
// import { queryEntitySimilar, queryEntityReferences } from 'queries';


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

        // const { expandQuery, expandResult } = this.props;
        // if (expandResult.shouldLoad) {
        //     this.props.queryEntityExpand({ query: expandQuery });
        // }

        // const { similarQuery, similarResult } = this.props;
        // if (entity?.schema?.matchable && similarResult.shouldLoad) {
        //     this.props.queryEntities({ query: similarQuery });
        // }
    }

    render() {
        return this.props.children;
    }
}


const mapStateToProps = (state, ownProps) => {
    const { profileId, location } = ownProps;
    // const similarQuery = queryEntitySimilar(location, entityId);
    // const expandQuery = queryEntityReferences(entityId);
    return {
        profile: selectProfile(state, profileId),
        tagsResult: selectProfileTags(state, profileId),
        // similarQuery,
        // similarResult: selectEntitiesResult(state, similarQuery),
        // expandQuery,
        // expandResult: selectEntityExpandResult(state, expandQuery),
    };
};

const mapDispatchToProps = {
    // queryEntities,
    // queryEntityExpand,
    fetchProfile,
    fetchProfileTags,
};

export default compose(
    withRouter,
    connect(mapStateToProps, mapDispatchToProps),
)(ProfileContextLoader);
