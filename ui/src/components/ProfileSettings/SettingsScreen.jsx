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
        return (
            <Screen>
                {/*<Breadcrumbs collection={collection} />*/}
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
        role: state.role
    };
};

export default connect(mapStateToProps, {fetchRole})(SettingsScreen);
