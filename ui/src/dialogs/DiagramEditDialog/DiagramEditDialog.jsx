import React, { Component } from 'react';
import { Dialog, Button, Intent, ProgressBar } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'src/app/Query';
import { Collection } from 'src/components/common';
import { createDiagram, undeleteEntity, updateDiagram } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getDiagramLink from 'src/util/getDiagramLink';
import { createEntitiesFromDiagram } from 'src/components/Diagram/util';

import DiagramImport from 'src/components/Diagram/DiagramImport'

import './DiagramEditDialog.scss';

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
  title_update: {
    id: 'diagram.update.title',
    defaultMessage: 'Diagram settings',
  },
  submit_update: {
    id: 'diagram.update.submit',
    defaultMessage: 'Submit',
  },
  success_update: {
    id: 'diagram.update.success',
    defaultMessage: 'Your diagram has been successfully updated.',
  },
});


class DiagramEditDialog extends Component {
  constructor(props) {
    super(props);
    const { diagram } = this.props;

    this.state = {
      label: diagram.label || '',
      summary: diagram.summary || '',
      collection: diagram.collection || '',
      layout: diagram.layout || null,
      importedFileName: null,
      processingProgress: 1,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onChangeCollection = this.onChangeCollection.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onProgress = this.onProgress.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      label: '',
      summary: '',
      collection: '',
      layout: null,
      importedFileName: null,
      processingProgress: 1,
    });
  }

  async onSubmit(event) {
    const { diagram, history, intl, isCreate, undeleteEntity } = this.props;
    const { data, id, label, summary, collection, layout, processingProgress } = this.state;
    event.preventDefault();
    if (processingProgress !== 1 || !this.checkValid()) return;
    this.setState({ processingProgress: 0 });

    try {
      if (isCreate) {
        const newDiagram = {
          label,
          summary,
          collection_id: parseInt(collection.id),
        };
        if (layout) {
          const { generatedEntities, generatedLayout } = await createEntitiesFromDiagram(
            { undeleteEntity, collection, layout, onProgress: this.onProgress }
          );
          newDiagram.layout = generatedLayout;
          newDiagram.entities = generatedEntities.map(e => e.id);
        }

        const response = await this.props.createDiagram(newDiagram);

        history.push({
          pathname: getDiagramLink(response.data)
        });
      } else {
        const updatedDiagram = diagram;
        updatedDiagram.label = label;
        updatedDiagram.summary = summary;

        await this.props.updateDiagram(updatedDiagram.id, updatedDiagram);
        this.setState({ processingProgress: 1 });
        this.props.toggleDialog();
      }

      showSuccessToast(intl.formatMessage(isCreate ? messages.success_create : messages.success_update));
    } catch (e) {
      this.setState({ processingProgress: 1 });
      showWarningToast(e.message);
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

  onImport({ fileName, label, layout }) {
    this.setState({ label, layout, importedFileName: fileName });
  }

  onProgress(processingProgress) {
    this.setState({ processingProgress });
  }

  checkValid() {
    const { label, collection } = this.state;

    return collection && label?.length > 0;
  }

  getCollectionOptionsQuery() {
    const { location } = this.props;

    const context = {
      'filter:kind': 'casefile',
    };
    return Query.fromLocation('collections', location, context, 'collections')
      .sortBy('label', 'asc');
  }

  render() {
    const { canChangeCollection, importEnabled, intl, isCreate, isOpen, toggleDialog } = this.props;
    const { collection, importedFileName, label, summary, processingProgress, layout } = this.state;
    const disabled = processingProgress !== 1 || !this.checkValid();

    let titleKey;
    if (isCreate) {
      if (importEnabled) {
        titleKey = messages.title_import;
      } else {
        titleKey = messages.title_create;
      }
    } else {
      titleKey = messages.title_update
    }

    const showTextFields = (!importEnabled || (importEnabled && layout));
    const showCollectionField = isCreate && canChangeCollection && showTextFields;

    return (
      <Dialog
        icon="graph"
        className="DiagramEditDialog"
        isOpen={isOpen}
        title={intl.formatMessage(titleKey)}
        onClose={toggleDialog}
      >
        <div className="DiagramEditDialog__contents">
          {processingProgress !== 1 && <div className="DiagramEditDialog__overlay" />}
          <form onSubmit={this.onSubmit}>
            <div className="bp3-dialog-body">
              {importEnabled && (
                <DiagramImport onImport={this.onImport} importedFile={importedFileName} />
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
                <div className="bp3-form-group">
                  <label className="bp3-label">
                    <FormattedMessage
                      id="diagram.collectionSelect"
                      defaultMessage="Select a dataset"
                    />
                    <Collection.Select
                      collection={collection}
                      onSelect={this.onChangeCollection}
                      query={this.getCollectionOptionsQuery()}
                    />
                  </label>
                </div>
              )}
            </div>
            <div className="bp3-dialog-footer">
              <div className="bp3-dialog-footer-actions">
                <Button
                  type="submit"
                  intent={Intent.PRIMARY}
                  disabled={disabled}
                  text={intl.formatMessage(isCreate ? messages.submit_create : messages.submit_update)}
                />
              </div>
            </div>
          </form>
        </div>
        {processingProgress !== 1 && (
          <ProgressBar value={processingProgress} intent={Intent.PRIMARY} />
        )}
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({});

DiagramEditDialog = injectIntl(DiagramEditDialog);
DiagramEditDialog = withRouter(DiagramEditDialog);
export default connect(mapStateToProps, { createDiagram, updateDiagram, undeleteEntity })(DiagramEditDialog);
