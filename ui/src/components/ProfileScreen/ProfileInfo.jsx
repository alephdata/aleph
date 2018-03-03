import React, {Component} from 'react';
import {connect} from 'react-redux';
import {AnchorButton} from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import {addRole, fetchRole} from 'src/actions';
import DualPane from 'src/components/common/DualPane';

import './ProfileInfo.css';
import {showSuccessToast, showErrorToast} from "../../app/toast";

const messages = defineMessages({
  placeholder_name: {
    id: 'profileinfo.placeholder_name',
    defaultMessage: 'Your name',
  },
  placeholder_enter_password: {
    id: 'profileinfo.placeholder_enter_password',
    defaultMessage: 'Enter your password',
  },
  placeholder_confirm_password: {
    id: 'profileinfo.placeholder_confirm_password',
    defaultMessage: 'Confirm your password',
  },
  update_success: {
    id: 'profileinfo.update_success',
    defaultMessage: 'You have updated your info!',
  },
  check_passwords: {
    id: 'profileinfo.check_passwords',
    defaultMessage: 'Check your passwords!',
  }
});

class ProfileInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      api_key: '',
      requiredLabel: 'pt-input input_class',
      requiredLabelText: 'pt-form-helper-text error_label_text'
    };

    this.onChangePass = this.onChangePass.bind(this);
    this.onChangeconfirmPassword = this.onChangeconfirmPassword.bind(this);
    this.onChangeName = this.onChangeName.bind(this);
    this.onSubmitInfo = this.onSubmitInfo.bind(this);
    this.checkPasswords = this.checkPasswords.bind(this);
  }

  componentDidMount() {
    this.props.fetchRole(this.props.session.role.id);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.role.isLoaded) {
      this.setState(nextProps.role);
    }
  }

  onChangePass({target}) {
    this.setState({password: target.value})
  }

  onChangeconfirmPassword({target}) {
    this.setState({confirmPassword: target.value})
  }

  onChangeName({target}) {
    this.setState({name: target.value})
  }

  checkPasswords() {
    if (!this.props.role.has_password) {
      return true;
    }
    return this.state.password === this.state.confirmPassword;
  }

  async onSubmitInfo() {
    const { intl } = this.props;
    if (this.checkPasswords()) {
      await this.props.addRole(this.state);
      showSuccessToast(intl.formatMessage(messages.update_success));
    } else {
      showErrorToast(intl.formatMessage(messages.check_passwords));
      this.setState({
        requiredLabel: 'pt-input input_class pt-intent-danger',
        requiredLabelText: 'pt-form-helper-text error_label_text show'
      })
    }
  }

  render() {
    const {intl, role} = this.props;

    return (
      <DualPane.InfoPane className="ProfileInfo">
        <section>
          <h1>
            <FormattedMessage id="profileinfo.title" defaultMessage="Settings"/>
          </h1>
          <div className="pt-form-group name_group">
            <div className='label_icon_group'>
              <i className="fa fa-fw fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="profileinfo.name" defaultMessage="Name"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                   type="text"
                   placeholder={intl.formatMessage(messages.placeholder_name)}
                   dir="auto"
                   onChange={this.onChangeName}
                   value={this.state.name}/>
            </div>
          </div>
          <div className="pt-form-group email_group">
            <div className='label_icon_group'>
              <i className="fa fa-fw fa-at" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="profileinfo.email" defaultMessage="Email"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                   type="text"
                   dir="auto"
                   disabled={true}
                   value={this.state.email}/>
            </div>
          </div>
          {role.has_password && (
            <div>
              <div className="pt-form-group email_group">
                <div className='label_icon_group'>
                  <i className="fa fa-unlock-alt" aria-hidden="true"/>
                  <label className="pt-label label_class">
                    <FormattedMessage id="profileinfo.password" defaultMessage="Password"/>
                  </label>
                </div>
                <div className="pt-form-content">
                  <input className={this.state.requiredLabel}
                      type="password"
                      placeholder={intl.formatMessage(messages.placeholder_enter_password)}
                      dir="auto"
                      onChange={this.onChangePass}
                      value={this.state.password === null ? '' : this.state.password}/>
                </div>
              </div>
              <div className="pt-form-group email_group">
                <div className='label_icon_group'>
                  <i className="fa fa-unlock-alt" aria-hidden="true"/>
                  <label className="pt-label label_class">
                    <FormattedMessage id="profileinfo.confirmPassword" defaultMessage="Confirm password"/>
                  </label>
                </div>
                <div className="pt-form-content">
                  <input className={this.state.requiredLabel}
                      type="password"
                      placeholder={intl.formatMessage(messages.placeholder_confirm_password)}
                      dir="auto"
                      onChange={this.onChangeconfirmPassword}
                      value={this.state.confirmPassword}/>
                </div>
                <div className={this.state.requiredLabelText}>
                  <FormattedMessage id="profileinfo.error" defaultMessage="Passwords are not the same!"/>
                </div>
              </div>
            </div>
          )}
          <div className="pt-button-group pt-fill button_div" onClick={this.onSubmitInfo}>
            <AnchorButton>
              <FormattedMessage id="profileinfo.save" defaultMessage="Save changes"/>
            </AnchorButton>
          </div>
        </section>
        <section className='api_key_div'>
          <h1>
            <FormattedMessage id="profileinfo.api" defaultMessage="API Key"/>
          </h1>
          <div>
            <div className="pt-form-content">
              <div className="pt-input-group">
                <span className="pt-icon pt-icon-key"></span>
                <input className="pt-input"
                   readOnly={true}
                   value={this.state.api_key}/>
              </div>
            </div>
            <label className="pt-label api_key_label">
              <FormattedMessage id="profileinfo.api_desc"
                                defaultMessage="Use the API key to read and write data via a remote application or client library"
                                />
            </label>
          </div>
        </section>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    session: state.session,
    role: state.role,
  };
};

export default connect(mapStateToProps, {addRole, fetchRole})(injectIntl(ProfileInfo));
