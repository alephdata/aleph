import React, {Component} from 'react';
import {connect} from 'react-redux';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import AlertsScreen from './AlertsScreen';
import ProfileInfo from './ProfileInfo';
import {fetchRole} from 'src/actions';

class SettingsScreen extends Component {

    componentDidMount() {
        this.props.fetchRole(this.props.session.role.id);
    }

    render() {
        const {collection, app} = this.props
        return (
            <Screen>
                <Breadcrumbs collection={{label: 'User Settings', links: {ui: app.ui_uri + 'settings'}}} />
                <DualPane>
                    <ProfileInfo/>
                    <AlertsScreen/>
                </DualPane>
            </Screen>

        )
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        session: state.session,
        role: state.role,
        collection: state.collection,
        app: state.metadata.app
    };
};

export default connect(mapStateToProps, {fetchRole})(SettingsScreen);
