import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import {
  createCollection,
  updateCollectionPermissions,
} from 'actions';
import { showWarningToast } from 'app/toast';
import { Language, Role } from 'components/common';
import FormDialog from 'dialogs/common/FormDialog';
import getCollectionLink from 'util/getCollectionLink';

const messages = defineMessages({
  label_placeholder: {
    id: 'case.label_placeholder',
    defaultMessage: 'Untitled investigation',
  },
  language_placeholder: {
    id: 'case.language_placeholder',
    defaultMessage: 'Select languages',
  },
  summary_placeholder: {
    id: 'case.summary',
    defaultMessage: 'A brief description of the investigation',
  },
  save: {
    id: 'case.save',
    defaultMessage: 'Save',
  },
  share_with: {
    id: 'case.users',
    defaultMessage: 'Search users',
  },
  title: {
    id: 'case.title',
    defaultMessage: 'Create an investigation',
  },
});

/* eslint-disable */

class CreateInvestigationDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: {
        label: '',
        summary: '',
        casefile: true,
        languages: []
      },
      permissions: [],
      blocking: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onAddRole = this.onAddRole.bind(this);
    this.onDeleteRole = this.onDeleteRole.bind(this);
    this.onSelectLanguages = this.onSelectLanguages.bind(this);
  }

  onAddRole(role) {
    const { permissions } = this.state;
    permissions.push({ role, read: true, write: true });
    this.setState({ permissions });
  }

  onDeleteRole(role) {
    const { permissions } = this.state;
    const newPermissions = permissions.filter(permission => permission.role.id !== role.role.id);
    this.setState({ permissions: newPermissions });
  }

  onSelectLanguages(languages) {
    const { collection } = this.state;
    collection.languages = languages;
    this.setState({ collection });
  }


  async onSubmit() {
    const { history, createCollection, toggleDialog, updateCollectionPermissions, preventRedirect } = this.props;
    const { collection, permissions } = this.state;
    if (!this.checkValid()) return;
    this.setState({ blocking: true });
    try {
      const response = await createCollection(collection);
      const collectionId = response.data.id;
      await updateCollectionPermissions(collectionId, permissions);
      this.setState({ blocking: false });
      if (preventRedirect) {
        toggleDialog(response.data);
      } else {
        history.push(getCollectionLink({ collection: response.data }));
      }
    } catch (e) {
      this.setState({ blocking: false });
      showWarningToast(e.message);
    }
  }

  onChangeLabel({ target }) {
    const { collection } = this.state;
    collection.label = target.value;
    this.setState({ collection });
  }

  onChangeSummary({ target }) {
    const { collection } = this.state;
    collection.summary = target.value;
    this.setState({ collection });
  }

  checkValid() {
    const { collection } = this.state;
    return collection.label.trim().length >= 3;
  }

  render() {
    const { intl, isOpen, toggleDialog } = this.props;
    const { collection, permissions, blocking } = this.state;
    const exclude = permissions.map(perm => parseInt(perm.role.id, 10));
    const disabled = blocking || !this.checkValid();

    return (
      <FormDialog
        processing={blocking}
        icon="briefcase"
        className="CreateInvestigationDialog"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
        enforceFocus={false}
        autoFocus={false}
      >
        <div className="bp3-dialog-body">
          <div className="bp3-form-group">
            <label className="bp3-label" htmlFor="label">
              <FormattedMessage id="case.choose.name" defaultMessage="Title" />
              <div className="bp3-input-group bp3-fill">
                <input
                  id="label"
                  type="text"
                  className="bp3-input"
                  autoComplete="off"
                  placeholder={intl.formatMessage(messages.label_placeholder)}
                  onChange={this.onChangeLabel}
                  value={collection.label}
                />
              </div>
            </label>
          </div>
          <div className="bp3-form-group">
            <label className="bp3-label" htmlFor="summary">
              <FormattedMessage
                id="case.choose.summary"
                defaultMessage="Summary"
              />
              <div className="bp3-input-group bp3-fill">
                <textarea
                  id="summary"
                  className="bp3-input"
                  placeholder={intl.formatMessage(messages.summary_placeholder)}
                  onChange={this.onChangeSummary}
                  value={collection.summary}
                />
              </div>
            </label>
          </div>
          <div className="bp3-form-group">
            <label className="bp3-label">
              <FormattedMessage id="case.chose.languages" defaultMessage="Languages" />
            </label>
            <Language.MultiSelect
              onSubmit={this.onSelectLanguages}
              values={collection.languages || []}
              inputProps={{
                inputRef: null,
                placeholder: intl.formatMessage(messages.language_placeholder),
              }}
            />
            <div className="bp3-form-helper-text">
              <FormattedMessage
                id="case.languages.helper"
                defaultMessage="Used for optical text recognition in non-Latin alphabets."
              />
            </div>
          </div>
          <div className="bp3-form-group">
            <label className="bp3-label">
              <FormattedMessage
                id="case.share.with"
                defaultMessage="Share with"
              />
              <Role.Select onSelect={this.onAddRole} exclude={exclude} />
            </label>
          </div>
          {permissions.length !== 0 && (
            <table className="settings-table">
              <tbody>
                {permissions.map(permission => (
                  <tr key={permission.role.id + 1}>
                    <td>
                      <Role.Label role={permission.role} icon={false} long />
                    </td>
                    <td>
                      <Button
                        onClick={e => this.onDeleteRole(permission, e)}
                        small
                        minimal
                        icon="remove"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              onClick={this.onSubmit}
              intent={Intent.PRIMARY}
              disabled={disabled}
              text={intl.formatMessage(messages.save)}
            />
          </div>
        </div>
      </FormDialog>
    );
  }
}

CreateInvestigationDialog = injectIntl(CreateInvestigationDialog);
CreateInvestigationDialog = withRouter(CreateInvestigationDialog);
export default connect(null, { createCollection, updateCollectionPermissions })(CreateInvestigationDialog);
