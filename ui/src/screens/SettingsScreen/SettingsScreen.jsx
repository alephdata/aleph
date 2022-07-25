import React from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import {
  Button,
  Intent,
  FormGroup,
  InputGroup,
  Checkbox,
  Alignment,
  MenuItem,
  Classes,
} from '@blueprintjs/core';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import { showSuccessToast } from 'app/toast';
import Screen from 'components/Screen/Screen';
import Dashboard from 'components/Dashboard/Dashboard';
import ClipboardInput from 'components/common/ClipboardInput';
import { updateRole } from 'actions';
import { selectMetadata, selectLocale, selectCurrentRole } from 'selectors';
import SelectWrapper from 'components/common/SelectWrapper';

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
  name: {
    id: 'settings.name',
    defaultMessage: 'Name',
  },
  locale: {
    id: 'settings.locale',
    defaultMessage: 'Language',
  },
  api_key: {
    id: 'settings.api_key',
    defaultMessage: 'API Secret Access Key',
  },
  api_key_help: {
    id: 'profileinfo.api_desc',
    defaultMessage:
      'Use the API key to read and write data via remote applications.',
  },
  email: {
    id: 'settings.email',
    defaultMessage: 'E-mail Address',
  },
  email_no_change: {
    id: 'settings.email.no_change',
    defaultMessage: 'Your e-mail address cannot be changed',
  },
  email_muted: {
    id: 'settings.email.muted',
    defaultMessage: 'Receive daily notification e-mails',
  },
  beta_tester: {
    id: 'settings.email.tester',
    defaultMessage: 'Test new features before they are finished',
  },
  current_password: {
    id: 'settings.current_password',
    defaultMessage: 'Current password',
  },
  current_explain: {
    id: 'settings.current_explain',
    defaultMessage: 'Enter your current password to set a new one.',
  },
  new_password: {
    id: 'settings.new_password',
    defaultMessage: 'New password',
  },
  confirm: {
    id: 'settings.confirm',
    defaultMessage: '(confirm)',
  },
  password_rules: {
    id: 'settings.password.rules',
    defaultMessage: 'Use at least six characters',
  },
  password_mismatch: {
    id: 'settings.password.missmatch',
    defaultMessage: 'Passwords do not match',
  },
  saved: {
    id: 'settings.saved',
    defaultMessage: "It's official, your profile is updated.",
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
    this.onToggleMuted = this.onToggleMuted.bind(this);
    this.onToggleTester = this.onToggleTester.bind(this);
    this.onSelectLocale = this.onSelectLocale.bind(this);
    this.renderLocale = this.renderLocale.bind(this);
  }

  static getDerivedStateFromProps(props) {
    return { role: props.role };
  }

  async onSave() {
    const { intl } = this.props;
    const { role } = this.state;
    if (this.valid()) {
      if (role.password === null || role.password === '') {
        delete role.password;
      }
      await this.props.updateRole(role);
      showSuccessToast(intl.formatMessage(messages.saved));
    }
  }

  onChangeInput({ target }) {
    const { role } = this.state;
    role[target.id] = target.value;
    this.setState({ role });
  }

  onToggleMuted() {
    const { role } = this.state;
    role.is_muted = !role.is_muted;
    this.setState({ role });
  }

  onToggleTester() {
    const { role } = this.state;
    role.is_tester = !role.is_tester;
    this.setState({ role });
  }

  onSelectLocale(locale, event) {
    const { role } = this.state;
    event.stopPropagation();
    role.locale = locale;
    this.setState({ role });
  }

  validName() {
    const {
      role: { name },
    } = this.state;
    return name !== undefined && name !== null && name.length > 2;
  }

  validPassword() {
    const {
      role: { password },
    } = this.state;
    // if (!this.state.role.has_password) return true;
    if (password === undefined || password === null || password.length === 0) {
      return true;
    }
    return password.length > 5;
  }

  validPasswordConfirm() {
    const {
      role: { password, passwordConfirm },
    } = this.state;
    return password === passwordConfirm;
  }

  valid() {
    return (
      this.validName() && this.validPassword() && this.validPasswordConfirm()
    );
  }

  renderLocale(locale, { handleClick, modifiers }) {
    const { locales } = this.props.metadata.app;
    return (
      <MenuItem
        className={modifiers.active ? Classes.ACTIVE : ''}
        key={locale}
        onClick={handleClick}
        text={locales[locale]}
      />
    );
  }

  renderPassword() {
    const { intl, metadata } = this.props;
    const { role } = this.state;

    if (!metadata.auth.password_login_uri) {
      return null;
    }
    const passwordIntent = this.validPassword() ? undefined : Intent.DANGER;
    const confirm = this.validPasswordConfirm();
    const confirmIntent = confirm ? undefined : Intent.DANGER;
    const confirmHelper = confirm
      ? undefined
      : intl.formatMessage(messages.password_mismatch);
    return (
      <>
        <h3>
          <FormattedMessage
            id="settings.password.title"
            defaultMessage="Change your password"
          />
        </h3>
        <FormGroup
          label={intl.formatMessage(messages.current_password)}
          labelFor="current_password"
          helperText={intl.formatMessage(messages.current_explain)}
        >
          <InputGroup
            id="current_password"
            value={role.current_password || ''}
            onChange={this.onChangeInput}
            type="password"
          />
        </FormGroup>
        <FormGroup
          label={intl.formatMessage(messages.new_password)}
          labelFor="password"
          helperText={intl.formatMessage(messages.password_rules)}
          intent={passwordIntent}
        >
          <InputGroup
            id="password"
            value={role.password || ''}
            onChange={this.onChangeInput}
            intent={passwordIntent}
            type="password"
          />
        </FormGroup>
        <FormGroup
          label={intl.formatMessage(messages.new_password)}
          labelInfo={intl.formatMessage(messages.confirm)}
          labelFor="password"
          helperText={confirmHelper}
          intent={confirmIntent}
        >
          <InputGroup
            id="passwordConfirm"
            value={role.passwordConfirm || ''}
            onChange={this.onChangeInput}
            intent={confirmIntent}
            type="password"
          />
        </FormGroup>
      </>
    );
  }

  renderForm() {
    const { intl, metadata } = this.props;
    const { role } = this.state;
    const nameIntent = this.validName() ? undefined : Intent.DANGER;
    const locales = Object.keys(metadata.app.locales);
    if (!role.id) {
      return null;
    }
    return (
      <div className="settings-form">
        <FormGroup
          label={intl.formatMessage(messages.name)}
          labelFor="name"
          intent={nameIntent}
        >
          <InputGroup
            id="name"
            value={role.name}
            onChange={this.onChangeInput}
            intent={nameIntent}
            autoFocus
            large
          />
        </FormGroup>
        <FormGroup
          label={intl.formatMessage(messages.locale)}
          labelFor="locale"
        >
          <SelectWrapper
            itemRenderer={this.renderLocale}
            items={locales}
            onItemSelect={this.onSelectLocale}
            popoverProps={{
              minimal: true,
              fill: true,
            }}
            inputProps={{
              fill: true,
            }}
            filterable={false}
          >
            <Button
              fill
              text={metadata.app.locales[role.locale]}
              alignText={Alignment.LEFT}
              icon="translate"
              rightIcon="caret-down"
            />
          </SelectWrapper>
        </FormGroup>
        <FormGroup
          label={intl.formatMessage(messages.api_key)}
          labelFor="api_key"
          helperText={intl.formatMessage(messages.api_key_help)}
        >
          <ClipboardInput id="api_key" icon="key" value={role.api_key} />
        </FormGroup>
        <FormGroup
          label={intl.formatMessage(messages.email)}
          labelFor="email"
          helperText={intl.formatMessage(messages.email_no_change)}
        >
          <InputGroup id="email" readOnly value={role.email} />
        </FormGroup>
        <Checkbox
          checked={!role.is_muted}
          label={intl.formatMessage(messages.email_muted)}
          onChange={this.onToggleMuted}
        />
        <Checkbox
          checked={role.is_tester}
          label={intl.formatMessage(messages.beta_tester)}
          onChange={this.onToggleTester}
        />
        {this.renderPassword()}
        <FormGroup>
          <Button
            className="settings-form__submit"
            intent={Intent.PRIMARY}
            onClick={this.onSave}
            disabled={!this.valid()}
            text={intl.formatMessage(messages.save_button)}
            large
          />
        </FormGroup>
      </div>
    );
  }

  render() {
    const { intl } = this.props;
    return (
      <Screen
        title={intl.formatMessage(messages.title)}
        className="SettingsScreen"
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">
              {intl.formatMessage(messages.title)}
            </h5>
          </div>
          {this.renderForm()}
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = (state) => ({
  metadata: selectMetadata(state),
  role: {
    ...selectCurrentRole(state),
    locale: selectLocale(state),
  },
});

SettingsScreen = withRouter(SettingsScreen);
SettingsScreen = connect(mapStateToProps, { updateRole })(SettingsScreen);
SettingsScreen = injectIntl(SettingsScreen);
export default SettingsScreen;
