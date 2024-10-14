import React, { Component } from 'react';
import { Button, Classes, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import c from 'classnames';

import withRouter from 'app/withRouter';
import { createCollection, updateCollectionPermissions } from 'actions';
import { showWarningToast } from 'app/toast';
import { Language } from 'components/common';
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
        languages: [],
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
    const newPermissions = permissions.filter(
      (permission) => permission.role.id !== role.role.id
    );
    this.setState({ permissions: newPermissions });
  }

  onSelectLanguages(languages) {
    const { collection } = this.state;
    collection.languages = languages;
    this.setState({ collection });
  }

  async onSubmit() {
    const {
      navigate,
      createCollection,
      toggleDialog,
      updateCollectionPermissions,
      preventRedirect,
    } = this.props;
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
        navigate(getCollectionLink({ collection: response.data }));
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
    const exclude = permissions.map((perm) => parseInt(perm.role.id, 10));
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
        <div className={Classes.DIALOG_BODY}>
          <div className={Classes.FORM_GROUP}>
            <label className={Classes.LABEL} htmlFor="label">
              <FormattedMessage id="case.choose.name" defaultMessage="Title" />
              <div className={c(Classes.INPUT_GROUP, Classes.FILL)}>
                <input
                  id="label"
                  type="text"
                  className={Classes.INPUT}
                  autoComplete="off"
                  placeholder={intl.formatMessage(messages.label_placeholder)}
                  onChange={this.onChangeLabel}
                  value={collection.label}
                />
              </div>
            </label>
          </div>
          <div className={Classes.FORM_GROUP}>
            <label className={Classes.LABEL} htmlFor="summary">
              <FormattedMessage
                id="case.choose.summary"
                defaultMessage="Summary"
              />
              <div className={c(Classes.INPUT_GROUP, Classes.FILL)}>
                <textarea
                  id="summary"
                  className={Classes.INPUT}
                  placeholder={intl.formatMessage(messages.summary_placeholder)}
                  onChange={this.onChangeSummary}
                  value={collection.summary}
                />
              </div>
            </label>
          </div>
          <div className={Classes.FORM_GROUP}>
            <label className={Classes.LABEL}>
              <FormattedMessage
                id="case.chose.languages"
                defaultMessage="Languages"
              />
            </label>
            <Language.MultiSelect
              onSubmit={this.onSelectLanguages}
              values={collection.languages || []}
              inputProps={{
                inputRef: null,
                placeholder: intl.formatMessage(messages.language_placeholder),
              }}
            />
            <div className={Classes.FORM_HELPER_TEXT}>
              <FormattedMessage
                id="case.languages.helper"
                defaultMessage="Used for optical text recognition in non-Latin alphabets."
              />
            </div>
          </div>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
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
export default connect(null, { createCollection, updateCollectionPermissions })(
  CreateInvestigationDialog
);
