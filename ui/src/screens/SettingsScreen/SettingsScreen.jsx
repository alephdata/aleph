import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button, Intent } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import c from 'classnames';
import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';

import { updateRole, fetchRole } from 'src/actions';
import { selectSession } from 'src/selectors';

import './SettingsScreen.scss';


const messages = defineMessages({
  title: {
    id: 'settings.title',
    defaultMessage: 'Settings',
  },
  save_button: {
    id: 'settings.save',
    defaultMessage: 'Update',
  },
});


export class SettingsScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      role: props.role,
    };
    this.onSave = this.onSave.bind(this);
    this.onChangeInput = this.onChangeInput.bind(this);
  }

  static getDerivedStateFromProps(props) {
    return { role: props.role };
  }

  componentDidUpdate(prevProps) {
    const { role, isOpen } = this.props;
    if (!prevProps.isOpen && isOpen) {
      this.props.fetchRole(role.id);
    }
  }

  async onSave() {
    const { role } = this.state;
    if (this.valid()) {
      if (role.password === null || role.password === '') {
        delete role.password;
      }
      await this.props.updateRole(role);
    }
  }

  onChangeInput({ target }) {
    const { role } = this.state;
    role[target.id] = target.value;
    this.setState({ role });
  }

  validName() {
    const { role: { name } } = this.state;
    return name !== undefined && name !== null && name.length > 2;
  }

  validPassword() {
    const { role: { password } } = this.state;
    // if (!this.state.role.has_password) return true;
    if (password === undefined || password === null || password.length === 0) {
      return true;
    }
    return password.length > 5;
  }

  validPasswordConfirm() {
    const { role: { password, passwordConfirm } } = this.state;
    return toString(password) === toString(passwordConfirm);
  }

  valid() {
    return this.validName() && this.validPassword() && this.validPasswordConfirm();
  }

  render() {
    const { intl } = this.props;
    const { role } = this.state;

    return (
      <Screen title={intl.formatMessage(messages.title)} requireSession>
        <Dashboard>
          <div className="bp3-form-group">
            <label className="bp3-label" htmlFor="name">
              <FormattedMessage
                id="settings.name"
                defaultMessage="Name"
              />
              <div className="bp3-form-content">
                <input
                  id="name"
                  className={c('bp3-input bp3-fill bp3-large', { 'bp3-intent-danger': !this.validName() })}
                  type="text"
                  dir="auto"
                  value={role.name}
                  onChange={this.onChangeInput}
                />
              </div>
            </label>

          </div>
          <div className={c('bp3-form-group', { 'bp3-intent-danger': !this.validPassword() })}>
            <label className="bp3-label" htmlFor="password">
              <FormattedMessage
                id="settings.password"
                defaultMessage="Password"
              />
              <div className="bp3-form-content">
                <input
                  id="password"
                  className={c('bp3-input bp3-fill', { 'bp3-intent-danger': !this.validPassword() })}
                  type="password"
                  dir="auto"
                  value={role.password || ''}
                  onChange={this.onChangeInput}
                />
                <div className="bp3-form-helper-text">
                  <FormattedMessage
                    id="settings.password.rules"
                    defaultMessage="Use at least six characters"
                  />
                </div>
              </div>
            </label>

          </div>
          <div className={c('bp3-form-group', { 'bp3-intent-danger': !this.validPasswordConfirm() })}>
            <label className="bp3-label" htmlFor="passwordConfirm">
              <FormattedMessage
                id="settings.password"
                defaultMessage="Password"
              />
              {' '}
              <span className="bp3-text-muted">
                <FormattedMessage
                  id="settings.password_confirm"
                  defaultMessage="(confirm)"
                />
              </span>
              <div className="bp3-form-content">
                <input
                  id="passwordConfirm"
                  className={c('bp3-input bp3-fill', { 'bp3-intent-danger': !this.validPasswordConfirm() })}
                  type="password"
                  dir="auto"
                  value={role.passwordConfirm || ''}
                  onChange={this.onChangeInput}
                />
                { !this.validPasswordConfirm() && (
                  <div className="bp3-form-helper-text">
                    <FormattedMessage
                      id="settings.password.missmatch"
                      defaultMessage="Passwords do not match"
                    />
                  </div>
                )}
              </div>
            </label>

          </div>
          <div className="bp3-form-group">
            <label className="bp3-label" htmlFor="email">
              <FormattedMessage
                id="settings.email"
                defaultMessage="E-mail Address"
              />
              <div className="bp3-form-content">
                <input
                  id="email"
                  className="bp3-input bp3-fill"
                  type="text"
                  dir="auto"
                  value={role.email}
                  readOnly
                />
                <div className="bp3-form-helper-text">
                  <FormattedMessage
                    id="settings.email.no_change"
                    defaultMessage="Your e-mail address cannot be changed"
                  />
                </div>
              </div>
            </label>
          </div>
          <div className="bp3-form-group">
            <label className="bp3-label" htmlFor="api_key">
              <FormattedMessage
                id="settings.api_key"
                defaultMessage="API Secret Access Key"
              />
              <div className="bp3-form-content">
                <div className="bp3-input-group bp3-fill">
                  <span className="bp3-icon bp3-icon-key" />
                  <input
                    className="bp3-input"
                    id="api_key"
                    readOnly
                    type="text"
                    dir="auto"
                    value={role.api_key}
                  />
                </div>
                <div className="bp3-form-helper-text">
                  <FormattedMessage
                    id="profileinfo.api_desc"
                    defaultMessage="Use the API key to read and write data via remote applications."
                  />
                </div>
              </div>
            </label>
          </div>
          <Button
            intent={Intent.PRIMARY}
            onClick={this.onSave}
            disabled={!this.valid()}
            text={intl.formatMessage(messages.save_button)}
          />
        </Dashboard>
      </Screen>
    );
  }
}


const mapStateToProps = state => ({
  session: selectSession(state),
  role: state.session.role,
});

export default compose(
  withRouter,
  connect(mapStateToProps, { fetchRole, updateRole }),
  injectIntl,
)(SettingsScreen);
