import React, {Component} from 'react';
import {connect} from 'react-redux';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';

import {addRole, fetchRole} from 'src/actions';
import DualPane from 'src/components/common/DualPane';

import './ProfileInfo.css';
import {showSuccessToast, showErrorToast} from "../../app/toast";

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
    return this.state.password === this.state.confirmPassword;
  }

  async onSubmitInfo() {
    if (this.checkPasswords()) {
      await this.props.addRole(this.state);
      showSuccessToast('You have updated your info!');
    } else {
      showErrorToast('Check your passwords!');
      this.setState({
        requiredLabel: 'pt-input input_class pt-intent-danger',
        requiredLabelText: 'pt-form-helper-text error_label_text show'
      })
    }
  }

  render() {
    const {intl, role} = this.props;
    // const {name, email, password, confirmPassword, api_key} = this.state;

    return (
      <DualPane.InfoPane className="ProfileInfo">
        <section>
          <h1>
            <FormattedMessage id="profile.info.title" defaultMessage="Settings"/>
          </h1>
          <div className="pt-form-group name_group">
            <div className='label_icon_group'>
              <i className="fa fa-fw fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="profile.info.name" defaultMessage="Name"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                   type="text"
                   placeholder={intl.formatMessage({
                     id: "profile.info.placeholder.name",
                     defaultMessage: "Your name"
                   })}
                   dir="auto"
                   onChange={this.onChangeName}
                   value={this.state.name}/>
            </div>
          </div>
          <div className="pt-form-group email_group">
            <div className='label_icon_group'>
              <i className="fa fa-fw fa-at" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="profile.info.email" defaultMessage="Email"/>
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
                    <FormattedMessage id="profile.info.password" defaultMessage="Password"/>
                  </label>
                </div>
                <div className="pt-form-content">
                  <input className={this.state.requiredLabel}
                      type="password"
                      placeholder={intl.formatMessage({
                        id: "profile.info.placeholder.confirm",
                        defaultMessage: "Enter your password"
                      })}
                      dir="auto"
                      onChange={this.onChangePass}
                      value={this.state.password === null ? '' : this.state.password}/>
                </div>
              </div>
              <div className="pt-form-group email_group">
                <div className='label_icon_group'>
                  <i className="fa fa-unlock-alt" aria-hidden="true"/>
                  <label className="pt-label label_class">
                    <FormattedMessage id="profile.info.confirmPassword" defaultMessage="Confirm password"/>
                  </label>
                </div>
                <div className="pt-form-content">
                  <input className={this.state.requiredLabel}
                      type="password"
                      placeholder={intl.formatMessage({
                        id: "profile.info.placeholder.confirm",
                        defaultMessage: "Confirm your password"
                      })}
                      dir="auto"
                      onChange={this.onChangeconfirmPassword}
                      value={this.state.confirmPassword}/>
                </div>
                <div className={this.state.requiredLabelText}>
                  <FormattedMessage id="profile.info.error" defaultMessage="Passwords are not the same!"/>
                </div>
              </div>
            </div>
          )}
          <div className="pt-button-group pt-fill button_div" onClick={this.onSubmitInfo}>
            <AnchorButton>
              <FormattedMessage id="profile.info.save" defaultMessage="Save changes"/>
            </AnchorButton>
          </div>
        </section>
        <section className='api_key_div'>
          <h1>
            <FormattedMessage id="profile.info.api" defaultMessage="API Key"/>
          </h1>
          <div>
            <div className='api_key_group'>
              <i className="fa fa-fw fa-key" aria-hidden="true"/>
              <label className="pt-label api_key">
                {this.state.api_key}
              </label>
            </div>
            <label className="pt-label api_key_label">
              <FormattedMessage id="profile.info.api.desc"
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
