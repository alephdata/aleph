import React, { Component } from 'react';
import { Dialog, Button, Intent, Spinner } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'src/app/Query';
import { Collection } from 'src/components/common';
import { createDiagram } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getDiagramLink from 'src/util/getDiagramLink';
import { processApiEntity } from 'src/components/Diagram/util';

import DiagramImport from 'src/components/Diagram/DiagramImport';

import './DiagramCreateDialog.scss';

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
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onChangeCollection = this.onChangeCollection.bind(this);
    this.onImport = this.onImport.bind(this);
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
    const { history, intl } = this.props;
    const { label, summary, collection, layout, processing } = this.state;
    event.preventDefault();
    if (processing || !this.checkValid()) return;
    this.setState({ processing: true });

    try {
      const newDiagram = {
        label,
        summary,
        collection_id: parseInt(collection.id, 10),
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

  onImport({ fileName, label, layout }) {
    this.setState({ label, layout, importedFileName: fileName });
  }

  getCollectionOptionsQuery() {
    const { location } = this.props;

    const context = {
      'filter:writeable': true,
    };
    return Query.fromLocation('collections', location, context, 'collections')
      .sortBy('label', 'asc');
  }

  checkValid() {
    const { label, collection } = this.state;

    return collection && label?.length > 0;
  }

  render() {
    const { canChangeCollection, importEnabled, intl, isOpen, toggleDialog } = this.props;
    const { collection, importedFileName, label, summary, processing, layout } = this.state;
    const disabled = processing || !this.checkValid();

    const showTextFields = (!importEnabled || (importEnabled && layout));
    const showCollectionField = canChangeCollection && showTextFields;

    return (
      <Dialog
        icon="graph"
        className="DiagramCreateDialog"
        isOpen={isOpen}
        title={intl.formatMessage(importEnabled ? messages.title_import : messages.title_create)}
        onClose={toggleDialog}
      >
        <div className="DiagramCreateDialog__contents">
          {processing && <div className="DiagramCreateDialog__overlay" />}
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
                  <div className="bp3-label">
                    <FormattedMessage
                      id="diagram.collectionSelect"
                      defaultMessage="Select a dataset"
                    />
                    <Collection.Select
                      collection={collection}
                      onSelect={this.onChangeCollection}
                      query={this.getCollectionOptionsQuery()}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="bp3-dialog-footer">
              <div className="bp3-dialog-footer-actions">
                <Button
                  type="submit"
                  intent={Intent.PRIMARY}
                  disabled={disabled}
                  text={(
                    intl.formatMessage(messages.submit_create)
                  )}
                />
              </div>
            </div>
          </form>
        </div>
        {processing && (
          <Spinner className="bp3-large" />
        )}
      </Dialog>
    );
  }
}

const mapStateToProps = () => ({});

DiagramCreateDialog = injectIntl(DiagramCreateDialog);
DiagramCreateDialog = withRouter(DiagramCreateDialog);
export default connect(mapStateToProps, {
  createDiagram,
})(DiagramCreateDialog);
