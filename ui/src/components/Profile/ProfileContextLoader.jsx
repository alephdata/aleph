import { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import {
    fetchProfile,
} from 'actions';
import {
    selectProfile,
} from 'selectors';
// import { queryEntitySimilar, queryFolderDocuments, queryEntityReferences } from 'queries';


class ProfileContextLoader extends PureComponent {
    componentDidMount() {
        this.fetchIfNeeded();
    }

    componentDidUpdate() {
        this.fetchIfNeeded();
    }

    fetchIfNeeded() {
        const { profileId, profile } = this.props;

        const loadDeep = !profile?.merged?.id && !profile.isPending;
        if (profile.shouldLoad || loadDeep) {
            this.props.fetchProfile({ id: profileId });
        }

        // if (tagsResult.shouldLoad) {
        //     this.props.fetchEntityTags({ id: entityId });
        // }

        // const { expandQuery, expandResult } = this.props;
        // if (expandResult.shouldLoad) {
        //     this.props.queryEntityExpand({ query: expandQuery });
        // }

        // const { similarQuery, similarResult } = this.props;
        // if (entity?.schema?.matchable && similarResult.shouldLoad) {
        //     this.props.queryEntities({ query: similarQuery });
        // }

        // const { childrenResult, childrenQuery } = this.props;
        // if (entity?.schema?.isA('Folder') && childrenResult.shouldLoad) {
        //     this.props.queryEntities({ query: childrenQuery });
        // }
    }

    render() {
        return this.props.children;
    }
}


const mapStateToProps = (state, ownProps) => {
    const { profileId, location } = ownProps;
    // const similarQuery = queryEntitySimilar(location, entityId);
    // const childrenQuery = queryFolderDocuments(location, entityId, undefined);
    // const expandQuery = queryEntityReferences(entityId);
    return {
        profile: selectProfile(state, profileId),
        // tagsResult: selectEntityTags(state, entityId),
        // similarQuery,
        // similarResult: selectEntitiesResult(state, similarQuery),
        // expandQuery,
        // expandResult: selectEntityExpandResult(state, expandQuery),
        // childrenQuery,
        // childrenResult: selectEntitiesResult(state, childrenQuery),
    };
};

const mapDispatchToProps = {
    // queryEntities,
    // queryEntityExpand,
    fetchProfile,
    // fetchEntityTags,
};

export default compose(
    withRouter,
    connect(mapStateToProps, mapDispatchToProps),
)(ProfileContextLoader);
