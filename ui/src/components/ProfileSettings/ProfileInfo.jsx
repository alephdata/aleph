import React, {Component} from 'react';
import {connect} from 'react-redux';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedNumber, FormattedMessage} from 'react-intl';

import DualPane from 'src/components/common/DualPane';

import './ProfileInfo.css';

class ProfileInfo extends Component {
    render() {
        console.log(this.props.session)
        let name = this.props.session.role.name;

        return (
            <DualPane.InfoPane>
                <h1>
                    Profile
                </h1>
                <div>
                    <div className="pt-form-group name_group">
                        <div className='label_icon_group'>
                            <i className="fa fa-id-card" aria-hidden="true"/>
                            <label className="pt-label label_class">
                                Name
                            </label>
                        </div>
                        <div className="pt-form-content">
                            <input id="name" defaultValue={name} className="pt-input input_class"
                                   placeholder="Enter your name" type="text" dir="auto"/>
                        </div>
                    </div>
                    <div className="pt-form-group email_group">
                        <div className='label_icon_group'>
                            <i className="fa fa-at" aria-hidden="true"/>
                            <label className="pt-label label_class">
                                Email
                            </label>
                        </div>
                        <div className="pt-form-content">
                            <input id="email" defaultValue='almir@gmail.com' className="pt-input input_class"
                                   placeholder="Enter your email" type="text" dir="auto"/>
                        </div>
                    </div>
                    <div className="pt-form-group email_group">
                        <div className='label_icon_group'>
                            <i className="fa fa-unlock-alt" aria-hidden="true"/>
                            <label className="pt-label label_class">
                                Password
                            </label>
                        </div>
                        <div className="pt-form-content">
                            <input id="password" className="pt-input input_class"
                                   placeholder="Enter your password" type="password" dir="auto"/>
                        </div>
                    </div>
                    <div className="pt-form-group email_group">
                        <div className='label_icon_group'>
                            <i className="fa fa-unlock-alt" aria-hidden="true"/>
                            <label className="pt-label label_class">
                                Confirm password
                            </label>
                        </div>
                        <div className="pt-form-content">
                            <input id="confirm-password" className="pt-input input_class"
                                   placeholder="Confirm your password" type="password" dir="auto"/>
                        </div>
                    </div>
                </div>
                <h1>
                    API Key
                </h1>
                <div>
                    <div className='api_key_group'>
                        <i className="fa fa-key" aria-hidden="true"/>
                        <label className="pt-label api_key">
                            AIzaSyBQPRRIAH6T2Uj3MW8pUqEkZFfkijktYzo
                        </label>
                    </div>
                    <label className="pt-label api_key_label">
                        Use the API key to read and write data
                        via a remote application or client library
                    </label>
                    <div className="pt-button-group pt-fill button_div">
                        <AnchorButton
                            href='/'
                            className="profile_info_anchor_button">
                            Save changes
                        </AnchorButton>
                    </div>
                </div>
            </DualPane.InfoPane>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        session: state.session
    };
};

export default connect(mapStateToProps)(ProfileInfo);
