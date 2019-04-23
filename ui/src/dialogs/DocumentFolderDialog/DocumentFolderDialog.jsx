import React, { Component } from 'react';
import { Intent, Dialog, Button } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { ingestDocument } from 'src/actions';
import { showErrorToast } from 'src/app/toast';

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

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChangeTitle = this.onChangeTitle.bind(this);
  }

  onChangeTitle(event) {
    this.setState({ title: event.target.value });
  }

  async onFormSubmit(event) {
    event.preventDefault();
    const {
      intl, collection, parent, history,
    } = this.props;
    const { title, blocking } = this.state;
    if (blocking) return;
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
      const result = await ingest(collection.id, metadata, null, this.onUploadProgress);
      history.push({
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
      <Dialog
        icon="folder-new"
        className="DocumentFolderDialog"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
      >
        <form onSubmit={this.onFormSubmit}>
          <div className="bp3-dialog-body">
            <div className="bp3-form-group">
              <div className="bp3-input-group bp3-large bp3-fill">
                <input
                  id="label"
                  type="text"
                  className="bp3-input"
                  autoComplete="off"
                  placeholder={intl.formatMessage(messages.untitled)}
                  onChange={this.onChangeTitle}
                  value={title}
                />
              </div>
            </div>
          </div>
          <div className="bp3-dialog-footer">
            <div className="bp3-dialog-footer-actions">
              <Button
                type="submit"
                disabled={blocking}
                intent={Intent.PRIMARY}
                text={intl.formatMessage(messages.save)}
              />
            </div>
          </div>
        </form>
      </Dialog>
    );
  }
}
const mapDispatchToProps = { ingestDocument };
export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
  injectIntl,
)(DocumentFolderDialog);
