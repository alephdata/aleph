import React, { Component } from 'react';
import { Intent, Dialog, Button } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { ingestDocument as ingestDocumentAction } from 'src/actions';

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
});


const mapStateToProps = () => ({});

@injectIntl
@withRouter
@connect(mapStateToProps, { ingestDocument: ingestDocumentAction })
export default class DocumentFolderDialog extends Component {
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
      collection, parent, history, ingestDocument,
    } = this.props;
    const { title } = this.state;
    try {
      let foreignId = title;
      if (parent) {
        foreignId = `${parent.foreign_id}/${foreignId}`;
      }
      const metadata = {
        title,
        foreign_id: foreignId,
        parent,
      };
      const result = await ingestDocument(collection.id, metadata, null, this.onUploadProgress);
      const document = result.documents[0];
      history.push({
        pathname: `/documents/${document.id}`,
      });
    } catch (e) {
      console.log(e);
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
