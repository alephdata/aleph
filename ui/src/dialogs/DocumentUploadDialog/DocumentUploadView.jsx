import React, { PureComponent } from 'react';
import { Button, Checkbox, Icon, Intent } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';

import convertPathsToTree from 'src/util/convertPathsToTree';

import './DocumentUploadView.scss';

const messages = defineMessages({
  save: {
    id: 'document.upload.save',
    defaultMessage: 'Upload',
  },
});

export class DocumentUploadView extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      filesToUpload: props.files,
    };

    this.toggleFile = this.toggleFile.bind(this);
    this.submit = this.submit.bind(this);
  }

  submit() {
    const { filesToUpload } = this.state;

    this.props.onSubmit(filesToUpload);
  }

  toggleFile(file) {
    this.setState(({ filesToUpload }) => ({
      filesToUpload: filesToUpload.includes(file)
        ? filesToUpload.filter(f => f !== file)
        : [...filesToUpload, ...[file]],
    }));
  }

  renderFolder(folder) {
    return Object.entries(folder).map(([key, value]) => {
      if (value instanceof File) {
        return this.renderFile(value);
      }

      return (
        <div className="DocumentUploadView__folder" key={key}>
          <h6 className="DocumentUploadView__folder__label bp3-heading">
            <Icon icon="folder-open" className="left-icon" />
            {key}
          </h6>
          <div className="DocumentUploadView__folder__content">
            {this.renderFolder(value)}
          </div>
        </div>
      );
    });
  }

  renderFile(file) {
    return (
      <Checkbox
        defaultChecked
        key={file.name}
        label={file.name}
        onChange={() => this.toggleFile(file)}
      />
    );
  }

  render() {
    const { files, intl } = this.props;

    const fileTree = convertPathsToTree(files);

    return (
      <div className="DocumentUploadView">
        <div className="DocumentUploadView__content">
          {this.renderFolder(fileTree)}
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              text={intl.formatMessage(messages.save)}
              onClick={this.submit}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(DocumentUploadView);
