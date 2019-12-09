import React, { Component } from 'react';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'src/app/Query';
import { Collection } from 'src/components/common';
import { createDiagram } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';

const messages = defineMessages({
  label_placeholder: {
    id: 'diagram.create.label_placeholder',
    defaultMessage: 'Untitled diagram',
  },
  summary_placeholder: {
    id: 'diagram.create.summary',
    defaultMessage: 'A brief description of the diagram',
  },
  save: {
    id: 'diagram.create.submit',
    defaultMessage: 'Create',
  },
  title: {
    id: 'diagram.create.title',
    defaultMessage: 'Create a network diagram',
  },
});

/* eslint-disable */

class CreateDiagramDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      label: '',
      summary: '',
      collection: null,
      processing: false,
    };

    this.onAddDiagram = this.onAddDiagram.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onChangeCollection = this.onChangeCollection.bind(this);
  }

  async onAddDiagram(event) {
    const { label, summary, collection, processing } = this.state;
    event.preventDefault();
    if (processing || !this.checkValid()) return;
    const diagram = {
      label,
      summary,
      data: {},
      collection_id: parseInt(collection.id),
    };
    this.setState({ processing: true });
    try {
      await this.props.createDiagram(diagram);
      this.setState({ processing: false });
      showSuccessToast("success");
    } catch (e) {
      this.setState({ processing: false });
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

  checkValid() {
    const { collection } = this.state;
    return collection !== null;
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
    const { intl, isOpen, toggleDialog } = this.props;
    const { collection, label, summary, processing } = this.state;
    const disabled = processing || !this.checkValid();

    return (
      <Dialog
        icon="graph"
        className="CreateDiagramDialog"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title)}
        onClose={toggleDialog}
      >
        <form onSubmit={this.onAddDiagram}>
          <div className="bp3-dialog-body">
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
                  />
                </div>
              </label>
            </div>
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
          </div>
          <div className="bp3-dialog-footer">
            <div className="bp3-dialog-footer-actions">
              <Button
                type="submit"
                intent={Intent.PRIMARY}
                disabled={disabled}
                text={intl.formatMessage(messages.save)}
              />
            </div>
          </div>
        </form>
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({});

CreateDiagramDialog = injectIntl(CreateDiagramDialog);
CreateDiagramDialog = withRouter(CreateDiagramDialog);
export default connect(mapStateToProps, { createDiagram })(CreateDiagramDialog);
