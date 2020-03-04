import React, { Component } from 'react';
import { Dialog, Button, Intent, Spinner } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import YAML from 'yaml'

import Query from 'src/app/Query';
import { Collection, FileImport } from 'src/components/common';
import { createDiagram } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getDiagramLink from 'src/util/getDiagramLink';
import { processApiEntity } from 'src/components/Diagram/util';


const messages = defineMessages({
  success: {
    id: 'mapping.import.success',
    defaultMessage: 'Your mapping has been imported successfully.',
  },
  submit: {
    id: 'mapping.import.submit',
    defaultMessage: 'Submit',
  },
  title: {
    id: 'mapping.import.title',
    defaultMessage: 'Import a mapping',
  },
  placeholder: {
    id: 'mapping.import.placeholder',
    defaultMessage: 'Drop a .yml file here or click to import an existing mapping file',
  },
});


class MappingImportDialog extends Component {
  constructor(props) {
    super(props);
    const { diagram } = this.props;

    this.state = {
      importedFileName: null,
      mappingData: null,
    };

    this.onImport = this.onImport.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      importedFileName: null,
      mappingData: null,
    });
  }

  onImport({ fileName, label, data }) {
    console.log(YAML.parse(data));
    const mappingData = YAML.parse(data);
    this.setState({ label, mappingData, importedFileName: fileName });
  }

  render() {
    const { intl, isOpen, onSubmit, toggleDialog } = this.props;
    const { importedFileName, mappingData } = this.state;

    return (
      <Dialog
        icon="graph"
        className="MappingImportDialog"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
      >
        <div className="MappingImportDialog__contents">
          <form onSubmit={this.onSubmit}>
            <div className="bp3-dialog-body">
              <FileImport
                accept=".yml"
                placeholder={intl.formatMessage(messages.placeholder)}
                onImport={this.onImport}
                importedFile={importedFileName}
              />
            </div>
            <div className="bp3-dialog-footer">
              <div className="bp3-dialog-footer-actions">
                <Button
                  type="submit"
                  intent={Intent.PRIMARY}
                  text={(
                    intl.formatMessage(messages.submit)
                  )}
                  onClick={() => onSubmit(mappingData)}
                />
              </div>
            </div>
          </form>
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = () => ({});

MappingImportDialog = injectIntl(MappingImportDialog);
MappingImportDialog = withRouter(MappingImportDialog);
export default connect(mapStateToProps, {
  createDiagram,
})(MappingImportDialog);
