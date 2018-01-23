import React, {Component} from 'react';
import {connect} from 'react-redux';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedNumber, FormattedMessage} from 'react-intl';
import { addRole } from 'src/actions';

import DualPane from 'src/components/common/DualPane';

import './ProfileInfo.css';

class ProfileInfo extends Component {
    constructor() {
        super();

        this.state = {
            name: '',
            email: '',
            password: '',
            confirmPass: '',
            api_key: '',
            requiredLabel: 'pt-input input_class',
            requiredLabelText: 'pt-form-helper-text error_label_text'
        };

        this.onChangePass = this.onChangePass.bind(this);
        this.onChangeConfirmPass = this.onChangeConfirmPass.bind(this);
        this.onChangeEmail = this.onChangeEmail.bind(this);
        this.onChangeName = this.onChangeName.bind(this);
        this.onSubmitInfo = this.onSubmitInfo.bind(this);
        this.checkPasswords = this.checkPasswords.bind(this);
     }

    componentWillReceiveProps(nextProps) {
        if(nextProps.role.isLoaded) {
            this.setState(nextProps.role)
        }

    }

    onChangeEmail({target}) {
        this.setState({email: target.value})
    }

    onChangePass({target}) {
        this.setState({password: target.value})
    }

    onChangeConfirmPass({target}) {
        this.setState({confirmPass: target.value})
    }

    onChangeName({target}) {
        this.setState({name: target.value})
    }

    checkPasswords() {
        return this.state.password === this.state.confirmPass;
    }

    onSubmitInfo() {
        let isCorrect = this.checkPasswords();
        if(isCorrect) {
            this.props.addRole(this.state);
        } else {
            this.setState({requiredLabel: 'pt-input input_class pt-intent-danger', requiredLabelText: 'pt-form-helper-text error_label_text show'})
        }
    }

    render() {

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
                            <input className="pt-input input_class"
                                   type="text"
                                   placeholder="Enter your name"
                                   dir="auto"
                                   onChange={this.onChangeName}
                                   value={this.state.name}/>
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
                            <input className="pt-input input_class"
                                   type="text"
                                   placeholder="Enter your email"
                                   dir="auto"
                                   onChange={this.onChangeEmail}
                                   value={this.state.email}/>
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
                            <input className={this.state.requiredLabel}
                                   type="password"
                                   placeholder="Enter your password"
                                   dir="auto"
                                   onChange={this.onChangePass}
                                   value={this.state.password}/>
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
                            <input className={this.state.requiredLabel}
                                   type="password"
                                   placeholder="Confirm your password"
                                   dir="auto"
                                   onChange={this.onChangeConfirmPass}
                                   value={this.state.confirmPass}/>
                        </div>
                        <div className={this.state.requiredLabelText}>Passwords are not the same!</div>
                    </div>
                    <div className="pt-button-group pt-fill button_div" onClick={this.onSubmitInfo}>
                        <AnchorButton
                            className="profile_info_anchor_button">
                            Save changes
                        </AnchorButton>
                    </div>
                </div>
                <h1 className='api_key_title'>
                    API Key
                </h1>
                <div>
                    <div className='api_key_group'>
                        <i className="fa fa-key" aria-hidden="true"/>
                        <label className="pt-label api_key">
                            {this.state.api_key}
                        </label>
                    </div>
                    <label className="pt-label api_key_label">
                        Use the API key to read and write data
                        via a remote application or client library
                    </label>
                </div>
            </DualPane.InfoPane>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        session: state.session,
        role: state.role
    };
};

export default connect(mapStateToProps, {addRole})(ProfileInfo);
