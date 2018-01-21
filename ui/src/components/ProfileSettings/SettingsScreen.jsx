import React, { Component } from 'react';
import { connect } from 'react-redux';

import { fetchRole } from 'src/actions';
import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import AlertsScreen from './AlertsScreen';
import ProfileInfo from './ProfileInfo';

class SettingsScreen extends Component {

    render() {
        const profileId = this.props.session.role.id;
        console.log('role', this.props.role, profileId);
        return (
            <Screen>
                {/*<Breadcrumbs collection={collection} />*/}
                <DualPane>
                    <ProfileInfo />
                    <AlertsScreen />
                </DualPane>
            </Screen>

        )
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        role: state.role,
        session: state.session
    };
};

export default connect(mapStateToProps, { fetchRole })(SettingsScreen);
