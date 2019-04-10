import React, { Component } from 'react';
import { Intent, Dialog, Button } from '@blueprintjs/core';
import { defineMessages } from 'react-intl';

import { ingestDocument } from 'src/actions';
import { showErrorToast } from 'src/app/toast';
import { enhancer } from 'src/util/enhancers';

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
    this.state = { title: '' };

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
    const { title } = this.state;
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
      console.log(result);
      history.push({
        pathname: `/documents/${result.id}`,
      });
    } catch (e) {
      showErrorToast(intl.formatMessage(messages.error));
    }
  }

  render() {
    const { intl, toggleDialog, isOpen } = this.props;
    const { title } = this.state;

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
export default enhancer({ mapDispatchToProps })(DocumentFolderDialog);
