import React, { Component } from 'react';
import { Dialog, Button, Intent, Radio, RadioGroup, Spinner } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import YAML from 'yaml'

import Query from 'src/app/Query';
import MappingQueryLabel from 'src/dialogs/MappingImportDialog/MappingQueryLabel';
import { Collection, FileImport } from 'src/components/common';
import { createDiagram } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getDiagramLink from 'src/util/getDiagramLink';
import { processApiEntity } from 'src/components/Diagram/util';

import './MappingImportDialog.scss';

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
  querySelect: {
    id: 'mapping.import.querySelect',
    defaultMessage: 'Select a mapping query from this file to import:',
  },
});


class MappingImportDialog extends Component {
  constructor(props) {
    super(props);
    const { diagram } = this.props;

    this.state = {
      importedFileName: null,
      mappingQueries: null,
      selectedQueryIndex: null,
    };

    this.onImport = this.onImport.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.onQuerySelect = this.onQuerySelect.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      importedFileName: null,
      mappingQueries: null,
    });
  }

  onQuerySelect(e) {
    this.setState({ selectedQueryIndex: e.target.value });
  }

  onImport({ fileName, label, data }) {
    const parsedData = YAML.parse(data);
    const firstEntry = Object.values(parsedData)[0];

    const mappingQueries = firstEntry.query ? [firstEntry.query] : firstEntry.queries;
    const selectedQueryIndex = mappingQueries.length === 1 ? 0 : null;
    this.setState({ label, mappingQueries, importedFileName: fileName, selectedQueryIndex });
  }

  onSubmit() {
    const { mappingQueries, selectedQueryIndex } = this.state;

    const selectedQuery = mappingQueries[selectedQueryIndex];
    this.props.onSubmit(selectedQuery.entities);
    this.props.toggleDialog();
  }

  render() {
    const { intl, isOpen, toggleDialog } = this.props;
    const { importedFileName, mappingQueries, selectedQueryIndex } = this.state;

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
              {mappingQueries && (
                <div className="MappingImportDialog__querySelect">
                  <RadioGroup
                    label={intl.formatMessage(messages.querySelect)}
                    onChange={this.onQuerySelect}
                    selectedValue={selectedQueryIndex}
                  >
                    {mappingQueries.map((query, i) => (
                      <Radio
                        value={`${i}`}
                        key={query.csv_url || query.csv_urls[0]}
                        label={<MappingQueryLabel query={query} />}
                      />
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>
            <div className="bp3-dialog-footer">
              <div className="bp3-dialog-footer-actions">
                <Button
                  intent={Intent.PRIMARY}
                  disabled={selectedQueryIndex === null}
                  text={(
                    intl.formatMessage(messages.submit)
                  )}
                  onClick={this.onSubmit}
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
