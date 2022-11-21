import React, { Component } from 'react';
import { Classes, Intent, Button } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import c from 'classnames';

import withRouter from 'app/withRouter';
import { forceMutate, ingestDocument } from 'actions';
import { showErrorToast } from 'app/toast';
import FormDialog from 'dialogs/common/FormDialog';

const messages = defineMessages({
  title: {
    id: 'document.folder.title',
    defaultMessage: 'New folder',
  },
  save: {
    id: 'document.folder.save',
    defaultMessage: 'Create',
  },
  untitled: {
    id: 'document.folder.untitled',
    defaultMessage: 'Folder title',
  },
  error: {
    id: 'document.folder.error',
    defaultMessage: 'There was an error creating the folder.',
  },
});

export class DocumentFolderDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: '',
      blocking: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeTitle = this.onChangeTitle.bind(this);
  }

  onChangeTitle(event) {
    this.setState({ title: event.target.value });
  }

  async onSubmit() {
    const { intl, collection, parent, navigate } = this.props;
    const { title } = this.state;
    this.setState({ blocking: true });
    try {
      const metadata = {
        file_name: title,
        foreign_id: title,
      };
      if (parent && parent.id) {
        metadata.foreign_id = `${parent.foreign_id}/${title}`;
        metadata.parent_id = parent.id;
      }
      const ingest = this.props.ingestDocument;
      const result = await ingest(collection.id, metadata, null, null);

      this.props.forceMutate();

      navigate({
        pathname: `/documents/${result.id}`,
      });
    } catch (e) {
      showErrorToast(intl.formatMessage(messages.error));
      this.setState({ blocking: false });
    }
  }

  render() {
    const { intl, toggleDialog, isOpen } = this.props;
    const { title, blocking } = this.state;

    return (
      <FormDialog
        processing={blocking}
        icon="folder-new"
        className="DocumentFolderDialog"
        isOpen={isOpen}
        onSubmit={this.onSubmit}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
      >
        <div className={Classes.DIALOG_BODY}>
          <div className={Classes.FORM_GROUP}>
            <div
              className={c(Classes.INPUT_GROUP, Classes.LARGE, Classes.FILL)}
            >
              <input
                id="label"
                type="text"
                className={Classes.INPUT}
                autoComplete="off"
                placeholder={intl.formatMessage(messages.untitled)}
                onChange={this.onChangeTitle}
                value={title}
              />
            </div>
          </div>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              type="submit"
              disabled={blocking}
              intent={Intent.PRIMARY}
              text={intl.formatMessage(messages.save)}
            />
          </div>
        </div>
      </FormDialog>
    );
  }
}
const mapDispatchToProps = { forceMutate, ingestDocument };
export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl
)(DocumentFolderDialog);
