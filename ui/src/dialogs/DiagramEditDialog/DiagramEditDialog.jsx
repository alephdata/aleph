import React, { Component } from 'react';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import Query from 'src/app/Query';
import { Collection } from 'src/components/common';
import { createDiagram, updateDiagram } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import getDiagramLink from 'src/util/getDiagramLink';

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

/* eslint-disable */

class DiagramEditDialog extends Component {
  constructor(props) {
    super(props);
    const { diagram } = this.props;
    this.state = {
      label: diagram ? diagram.label : '',
      summary: diagram ? diagram.summary : '',
      collection: diagram ? diagram.collection : null,
      processing: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
    this.onChangeCollection = this.onChangeCollection.bind(this);
  }

  async onSubmit(event) {
    const { diagram, history, intl, isCreate } = this.props;
    const { data, id, label, summary, collection, processing } = this.state;
    event.preventDefault();
    if (processing || !this.checkValid()) return;
    this.setState({ processing: true });
    try {
      if (isCreate) {
        const newDiagram = {
          label,
          summary,
          data: {"layout":{"entities":[],"vertices":[],"edges":[],"groupings":[],"selection":[]},"viewport":{"zoomLevel":0.4,"ratio":0.738,"center":{"x":0,"y":0}}},
          collection_id: parseInt(collection.id),
        };
        const response = await this.props.createDiagram(newDiagram);
        history.push({
          pathname: getDiagramLink(response.data)
        });
      } else {
        const updatedDiagram = diagram;
        diagram.label = label;
        diagram.summary = summary;

        await this.props.updateDiagram(diagram.id, updatedDiagram);
      }
      this.setState({ processing: false });
      showSuccessToast(intl.formatMessage(isCreate ? messages.success_create : messages.success_update));
      this.props.toggleDialog();
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
    const { label, collection } = this.state;

    return collection !== undefined && label?.length > 0;
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
    const { canChangeCollection, intl, isCreate, isOpen, toggleDialog } = this.props;
    const { collection, label, summary, processing } = this.state;
    const disabled = processing || !this.checkValid();

    return (
      <Dialog
        icon="graph"
        className="DiagramEditDialog"
        isOpen={isOpen}
        title={intl.formatMessage(isCreate ? messages.title_create : messages.title_update)}
        onClose={toggleDialog}
      >
        <form onSubmit={this.onSubmit}>
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
            {isCreate && canChangeCollection && (
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
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({});

DiagramEditDialog = injectIntl(DiagramEditDialog);
DiagramEditDialog = withRouter(DiagramEditDialog);
export default connect(mapStateToProps, { createDiagram, updateDiagram })(DiagramEditDialog);
