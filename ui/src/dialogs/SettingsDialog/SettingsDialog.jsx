import React, { Component } from 'react';
import { toString } from 'lodash';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import c from 'classnames';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { updateRole as updateRoleAction, fetchRole as fetchRoleAction } from 'src/actions';
import { selectSession } from 'src/selectors';


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


export class SettingsDialog extends Component {
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
    const { role, isOpen, fetchRole } = this.props;
    if (!prevProps.isOpen && isOpen) {
      fetchRole(role.id);
    }
  }

  async onSave() {
    const { role } = this.state;
    const { toggleDialog, updateRole } = this.props;
    if (this.valid()) {
      if (role.password === null || role.password === '') {
        delete role.password;
      }
      await updateRole(role);
      toggleDialog();
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
    const { intl, isOpen, toggleDialog } = this.props;
    const { role } = this.state;

    return (
      <Dialog
        icon="cog"
        isOpen={isOpen}
        onClose={toggleDialog}
        title={intl.formatMessage(messages.title)}
      >
        <div className="bp3-dialog-body">
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
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              intent={Intent.PRIMARY}
              onClick={this.onSave}
              disabled={!this.valid()}
              text={intl.formatMessage(messages.save_button)}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}
const mapStateToProps = state => ({
  session: selectSession(state),
  role: state.session.role,
});

const mapDispatchToProps = {
  fetchRole: fetchRoleAction,
  updateRole: updateRoleAction,
};
export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(SettingsDialog);
