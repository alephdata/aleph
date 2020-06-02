import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { updateDiagram } from 'src/actions';
import { showSuccessToast, showWarningToast } from 'src/app/toast';
import FormDialog from 'src/dialogs/common/FormDialog';

const messages = defineMessages({
  label_placeholder: {
    id: 'diagram.create.label_placeholder',
    defaultMessage: 'Untitled diagram',
  },
  summary_placeholder: {
    id: 'diagram.create.summary_placeholder',
    defaultMessage: 'A brief description of the diagram',
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
      processing: false,
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      label: '',
      summary: '',
    });
  }

  async onSubmit(event) {
    const { diagram, intl } = this.props;
    const { label, processing, summary } = this.state;
    event.preventDefault();
    if (processing || !this.checkValid()) return;
    this.setState({ processing: true });

    try {
      await this.props.updateDiagram(diagram.id, { label, summary });
      this.setState({ processing: false });
      this.props.toggleDialog();

      showSuccessToast(
        intl.formatMessage(messages.success_update),
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

  checkValid() {
    const { label } = this.state;
    return label?.length > 0;
  }

  render() {
    const { intl, isOpen, toggleDialog } = this.props;
    const { label, processing, summary } = this.state;
    const disabled = !this.checkValid();


    return (
      <FormDialog
        processing={processing}
        icon="graph"
        isOpen={isOpen}
        title={intl.formatMessage(messages.title_update)}
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
                    rows={5}
                  />
                </div>
              </label>
            </div>
          </div>
          <div className="bp3-dialog-footer">
            <div className="bp3-dialog-footer-actions">
              <Button
                type="submit"
                intent={Intent.PRIMARY}
                disabled={disabled}
                text={(
                  intl.formatMessage(messages.submit_update)
                )}
              />
            </div>
          </div>
        </form>
      </FormDialog>
    );
  }
}

const mapStateToProps = () => ({});

DiagramEditDialog = injectIntl(DiagramEditDialog);
export default connect(mapStateToProps, { updateDiagram })(DiagramEditDialog);
