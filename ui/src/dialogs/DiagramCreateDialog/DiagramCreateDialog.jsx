import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'src/app/Query';
import { Collection, FileImport } from 'src/components/common';
import CreateCaseDialog from 'src/dialogs/CreateCaseDialog/CreateCaseDialog';
import FormDialog from 'src/dialogs/common/FormDialog';
import { createDiagram } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getDiagramLink from 'src/util/getDiagramLink';
import { processApiEntity } from 'src/components/Diagram/util';


const messages = defineMessages({
  label_placeholder: {
    id: 'diagram.create.label_placeholder',
    defaultMessage: 'Untitled diagram',
  },
  summary_placeholder: {
    id: 'diagram.create.summary_placeholder',
    defaultMessage: 'A brief description of the diagram',
  },
  save: {
    id: 'diagram.create.submit',
    defaultMessage: 'Create',
  },
  title_create: {
    id: 'diagram.create.title',
    defaultMessage: 'Create a network diagram',
  },
  submit_create: {
    id: 'diagram.create.submit',
    defaultMessage: 'Create',
  },
  success_create: {
    id: 'diagram.create.success',
    defaultMessage: 'Your diagram has been created successfully.',
  },
  title_import: {
    id: 'diagram.import.title',
    defaultMessage: 'Import a network diagram',
  },
  placeholder_import: {
    id: 'diagram.import.placeholder',
    defaultMessage: 'Drop a .vis file here or click to import an existing diagram layout',
  },
  collection_select_placeholder: {
    id: 'diagram.create.collection.existing',
    defaultMessage: 'Select a dataset',
  },
});


class DiagramCreateDialog extends Component {
  constructor(props) {
    super(props);
    const { diagram } = this.props;

    this.state = {
      label: diagram.label || '',
      summary: diagram.summary || '',
      collection: diagram.collection || '',
      layout: diagram.layout || null,
      importedFileName: null,
      processing: false,
      collectionCreateIsOpen: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onChangeCollection = this.onChangeCollection.bind(this);
    this.onImport = this.onImport.bind(this);
    this.toggleCollectionCreateDialog = this.toggleCollectionCreateDialog.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      label: '',
      summary: '',
      collection: '',
      layout: null,
      importedFileName: null,
      processing: false,
    });
  }

  async onSubmit(event) {
    const { history, diagram, intl } = this.props;
    const { label, summary, collection, layout, processing } = this.state;
    event.preventDefault();
    if (processing || !this.checkValid()) return;
    this.setState({ processing: true });

    try {
      const newDiagram = {
        label,
        summary,
        collection_id: collection.id,
        entities: diagram?.entities || []
      };

      if (layout) {
        const { entities, selection, ...rest } = layout;
        newDiagram.entities = entities.map(processApiEntity);
        newDiagram.layout = rest;
      }

      const response = await this.props.createDiagram(newDiagram);
      this.setState({ processing: false });

      history.push({
        pathname: getDiagramLink(response.data),
      });

      showSuccessToast(
        intl.formatMessage(messages.success_create),
      );
    } catch (e) {
      showWarningToast(e.message);
      this.setState({ processing: false });
    }
  }

  onChangeLabel({ target }) {
    this.setState({ label: target.value });
  }

  onChangeSummary({ target }) {
    this.setState({ summary: target.value });
  }

  onChangeCollection(collection) {
    this.setState({ collection });
  }

  onImport({ fileName, label, data }) {
    const { layout } = JSON.parse(data);
    this.setState({ label, layout, importedFileName: fileName });
  }

  getCollectionOptionsQuery() {
    const { location } = this.props;

    const context = {
      'filter:writeable': true,
      'filter:casefile': true,
    };
    return Query.fromLocation('collections', location, context, 'collections')
      .sortBy('label', 'asc');
  }

  toggleCollectionCreateDialog(createdCollection) {
    console.log('created collection is', createdCollection);
    this.setState(({ collection, collectionCreateIsOpen }) => ({
      collection: createdCollection?.id ? createdCollection : collection,
      collectionCreateIsOpen: !collectionCreateIsOpen,
    }));
  }

  checkValid() {
    const { label, collection } = this.state;
    return collection && label?.length > 0;
  }

  render() {
    const { canChangeCollection, importEnabled, intl, isOpen, toggleDialog } = this.props;
    const { collection, collectionCreateIsOpen, importedFileName, label, summary, processing, layout } = this.state;
    const disabled = processing || !this.checkValid();

    const showTextFields = (!importEnabled || (importEnabled && layout));
    const showCollectionField = canChangeCollection && showTextFields;

    return (
      <FormDialog
        processing={processing}
        icon="graph"
        className="DiagramCreateDialog"
        isOpen={isOpen}
        title={intl.formatMessage(importEnabled ? messages.title_import : messages.title_create)}
        onClose={toggleDialog}
      >
        <div className="bp3-dialog-body">
          {importEnabled && (
            <FileImport
              accept=".vis"
              placeholder={intl.formatMessage(messages.placeholder_import)}
              onImport={this.onImport}
              importedFile={importedFileName}
            />
          )}
          {showTextFields && (
            <>
              <div className="bp3-form-group">
                <label className="bp3-label" htmlFor="label">
                  <FormattedMessage id="diagram.choose.name" defaultMessage="Title" />
                  <div className="bp3-input-group bp3-fill">
                    <input
                      id="label"
                      type="text"
                      className="bp3-input"
                      autoComplete="off"
                      placeholder={intl.formatMessage(messages.label_placeholder)}
                      onChange={this.onChangeLabel}
                      value={label}
                    />
                  </div>
                </label>
              </div>
              <div className="bp3-form-group">
                <label className="bp3-label" htmlFor="summary">
                  <FormattedMessage
                    id="diagram.choose.summary"
                    defaultMessage="Summary"
                  />
                  <div className="bp3-input-group bp3-fill">
                    <textarea
                      id="summary"
                      className="bp3-input"
                      placeholder={intl.formatMessage(messages.summary_placeholder)}
                      onChange={this.onChangeSummary}
                      value={summary}
                      rows={5}
                    />
                  </div>
                </label>
              </div>
            </>
          )}
          {showCollectionField && (
            <>
              <div className="bp3-form-group">
                <div className="bp3-label">
                  <FormattedMessage
                    id="diagram.create.collection"
                    defaultMessage="Dataset"
                  />
                  <Collection.Select
                    collection={collection}
                    onSelect={this.onChangeCollection}
                    query={this.getCollectionOptionsQuery()}
                    buttonProps={{
                      label: intl.formatMessage(messages.collection_select_placeholder)
                    }}
                  />
                  <div class="bp3-form-helper-text">
                    <FormattedMessage
                      id='diagram.create.collection.new'
                      defaultMessage={
                        `Don't see the dataset you're looking for? {link}`
                      }
                      values={{
                         link: (
                          /* eslint-disable */
                          <a onClick={() => this.toggleCollectionCreateDialog()}>
                            <FormattedMessage
                              id='entity.manager.bulk_import.link_text'
                              defaultMessage={
                                `Create a new personal dataset`
                              }
                            />
                          </a>
                         )
                       }}
                    />
                  </div>
                </div>
              </div>
              <CreateCaseDialog
                isOpen={collectionCreateIsOpen}
                toggleDialog={this.toggleCollectionCreateDialog}
                preventRedirect
              />
            </>
          )}
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              disabled={disabled}
              onClick={this.onSubmit}
              text={(
                intl.formatMessage(messages.submit_create)
              )}
            />
          </div>
        </div>
      </FormDialog>

    );
  }
}

const mapStateToProps = () => ({});

DiagramCreateDialog = injectIntl(DiagramCreateDialog);
DiagramCreateDialog = withRouter(DiagramCreateDialog);
export default connect(mapStateToProps, {
  createDiagram,
})(DiagramCreateDialog);
