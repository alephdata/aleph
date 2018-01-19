import React, { Component } from 'react';
import { connect } from 'react-redux';

import { fetchRole } from 'src/actions';
import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import AlertsScreen from './AlertsScreen';
import ProfileInfo from './ProfileInfo';
import store from '../../app/store';

class SettingsScreen extends Component {
    constructor() {
        super();

        this.state = {
            profileId: 0
        }
    }

    componentDidMount() {
        const session = store.getState();
        const profileId = session.role.id;
        this.props.fetchRole();
        if(profileId !== undefined) {
            this.setState({profileId: profileId});
        }
    }

    render() {
        const { profileId } = this.state;
        console.log('role', this.props.role, profileId);
        return (
            <Screen>
                {/*<Breadcrumbs collection={collection} />*/}
                <DualPane>
                    <ProfileInfo profileId={profileId} />
                    <AlertsScreen profileId={profileId} />
                </DualPane>
            </Screen>

        )
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        role: state.role
    };
};

export default connect(mapStateToProps, { fetchRole })(SettingsScreen);
