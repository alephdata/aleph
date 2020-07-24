import React, { Component } from 'react';
import { Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { updateEntitySet } from 'actions';
import { showSuccessToast, showWarningToast } from 'app/toast';
import FormDialog from 'dialogs/common/FormDialog';

const messages = defineMessages({
  label_placeholder: {
    id: 'entityset.create.label_placeholder',
    defaultMessage: 'Untitled {type}',
  },
  summary_placeholder: {
    id: 'entityset.create.summary_placeholder',
    defaultMessage: 'A brief description of the {type}',
  },
  title_update: {
    id: 'entityset.update.title',
    defaultMessage: 'Settings',
  },
  submit_update: {
    id: 'entityset.update.submit',
    defaultMessage: 'Submit',
  },
  success_update: {
    id: 'entityset.update.success',
    defaultMessage: 'Your {type} has been successfully updated.',
  },
});


class EntitySetEditDialog extends Component {
  constructor(props) {
    super(props);
    const { entitySet } = this.props;

    this.state = {
      type: entitySet.type || 'list',
      label: entitySet.label || '',
      summary: entitySet.summary || '',
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
      type: '',
    });
  }

  async onSubmit(event) {
    const { entitySet, intl } = this.props;
    const { type, label, processing, summary } = this.state;
    event.preventDefault();
    if (processing || !this.checkValid()) return;
    this.setState({ processing: true });

    try {
      await this.props.updateEntitySet(entitySet.id, { label, summary });
      this.setState({ processing: false });
      this.props.toggleDialog();

      showSuccessToast(
        intl.formatMessage({...messages.success_update, values: { type } }),
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
    const { type, label, processing, summary } = this.state;
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
                <FormattedMessage id="entityset.choose.name" defaultMessage="Title" />
                <div className="bp3-input-group bp3-fill">
                  <input
                    id="label"
                    type="text"
                    className="bp3-input"
                    autoComplete="off"
                    placeholder={intl.formatMessage(messages.label_placeholder, { type })}
                    onChange={this.onChangeLabel}
                    value={label}
                  />
                </div>
              </label>
            </div>
            <div className="bp3-form-group">
              <label className="bp3-label" htmlFor="summary">
                <FormattedMessage
                  id="entityset.choose.summary"
                  defaultMessage="Summary"
                />
                <div className="bp3-input-group bp3-fill">
                  <textarea
                    id="summary"
                    className="bp3-input"
                    placeholder={intl.formatMessage(messages.summary_placeholder, { type })}
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

EntitySetEditDialog = injectIntl(EntitySetEditDialog);
export default connect(mapStateToProps, { updateEntitySet })(EntitySetEditDialog);
