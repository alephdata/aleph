import React, { Component } from 'react';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import {
  createCollection,
  updateCollectionPermissions,
} from 'src/actions';
import { showWarningToast } from 'src/app/toast';
// import { Collection } from 'src/components/common';
import getCollectionLink from 'src/util/getCollectionLink';

const messages = defineMessages({
  label_placeholder: {
    id: 'diagram.label_placeholder',
    defaultMessage: 'Untitled diagram',
  },
  summary_placeholder: {
    id: 'diagram.summary',
    defaultMessage: 'A brief description of the diagram',
  },
  save: {
    id: 'diagram.save',
    defaultMessage: 'Save',
  },
  title: {
    id: 'diagram.title',
    defaultMessage: 'Create a diagram',
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
    this.setState({ processing: true });
    try {
      const response = await createCollection(collection);
      // const collectionId = response.data.id;
      // await updateCollectionPermissions(collectionId, permissions);
      this.setState({ processing: false });
      history.push({
        pathname: getCollectionLink(response.data)
      });
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

  onChangeCollection() {

  }

  checkValid() {
    return true;
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
                <div className="bp3-input-group bp3-large bp3-fill">
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
export default connect(mapStateToProps, { createCollection, updateCollectionPermissions })(CreateDiagramDialog);
