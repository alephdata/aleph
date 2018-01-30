import React, {Component} from 'react';
import {connect} from 'react-redux';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';

import {addRole, fetchRole} from 'src/actions';
import DualPane from 'src/components/common/DualPane';

import './ProfileInfo.css';

class ProfileInfo extends Component {
  constructor(props) {
    super(props);

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

  componentDidMount() {
    this.props.fetchRole(this.props.session.role.id);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.role.isLoaded) {
      this.setState(nextProps.role);
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
    if (isCorrect) {
      this.props.addRole(this.state);
    } else {
      this.setState({
        requiredLabel: 'pt-input input_class pt-intent-danger',
        requiredLabelText: 'pt-form-helper-text error_label_text show'
      })
    }
  }

  render() {
    const {intl, role} = this.props;
    const {name, email, password, confirmPass, api_key} = this.state;

    return (
      <DualPane.InfoPane className="ProfileInfo">
        <h1>
          Profile
        </h1>
        <div>
          <div className="pt-form-group name_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="profile.info.name" defaultMessage="Name"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                   type="text"
                   placeholder={intl.formatMessage({
                     id: "profile.info.placeholder.name",
                     defaultMessage: "Enter your name"
                   })}
                   dir="auto"
                   onChange={this.onChangeName}
                   value={name}/>
            </div>
          </div>
          <div className="pt-form-group email_group">
            <div className='label_icon_group'>
              <i className="fa fa-at" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="profile.info.email" defaultMessage="Email"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                   type="text"
                   placeholder={intl.formatMessage({
                     id: "profile.info.placeholder.email",
                     defaultMessage: "Enter your email"
                   })}
                   dir="auto"
                   onChange={this.onChangeEmail}
                   value={email}/>
            </div>
          </div>
          {role.has_password && <div className="pt-form-group email_group">
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
                   value={password === null ? '' : password}/>
            </div>
          </div>
          }
          {role.has_password && <div className="pt-form-group email_group">
            <div className='label_icon_group'>
              <i className="fa fa-unlock-alt" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="profile.info.confirmpass" defaultMessage="Confirm password"/>
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
                   onChange={this.onChangeConfirmPass}
                   value={confirmPass}/>
            </div>
            <div className={this.state.requiredLabelText}>
              <FormattedMessage id="profile.info.error" defaultMessage="Passwords are not the same!"/>
            </div>
          </div>}
          <div className="pt-button-group pt-fill button_div" onClick={this.onSubmitInfo}>
            <AnchorButton
              className="">
              <FormattedMessage id="profile.info.save" defaultMessage="Save changes"/>
            </AnchorButton>
          </div>
        </div>
        <div className='api_key_div'>
          <h1>
            <FormattedMessage id="profile.info.api" defaultMessage="API Key"/>
          </h1>
          <div>
            <div className='api_key_group'>
              <i className="fa fa-key" aria-hidden="true"/>
              <label className="pt-label api_key">
                {api_key}
              </label>
            </div>
            <label className="pt-label api_key_label">
              <FormattedMessage id="profile.info.api.desc" defaultMessage="Use the API key to read and write data
            via a remote application or client library"/>
            </label>
          </div>
        </div>
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
