import React, { Component } from 'react';
import { Button, Intent, Checkbox } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Role, Country, Language } from 'components/common';
import FormDialog from 'dialogs/common/FormDialog';
import { showSuccessToast, showWarningToast } from 'app/toast';
import { updateCollection } from 'actions';
import { selectMetadata, selectAdmin } from 'selectors';


const messages = defineMessages({
  placeholder_label: {
    id: 'collection.edit.info.placeholder_label',
    defaultMessage: 'A label',
  },
  placeholder_summary: {
    id: 'collection.edit.info.placeholder_summary',
    defaultMessage: 'A brief summary',
  },
  placeholder_publisher: {
    id: 'collection.edit.info.placeholder_publisher',
    defaultMessage: 'Organisation or person publishing this data',
  },
  placeholder_publisher_url: {
    id: 'collection.edit.info.placeholder_publisher_url',
    defaultMessage: 'Link to the publisher',
  },
  placeholder_info_url: {
    id: 'collection.edit.info.placeholder_info_url',
    defaultMessage: 'Link to further information',
  },
  placeholder_data_url: {
    id: 'collection.edit.info.placeholder_data_url',
    defaultMessage: 'Link to the raw data in a downloadable form',
  },
  placeholder_country: {
    id: 'collection.edit.info.placeholder_country',
    defaultMessage: 'Select countries',
  },
  placeholder_language: {
    id: 'collection.edit.info.placeholder_language',
    defaultMessage: 'Select languages',
  },
  check_restricted: {
    id: 'collection.edit.info.restricted',
    defaultMessage: 'This collection is restricted and viewers should be warned.',
  },
  title: {
    id: 'collection.edit.title',
    defaultMessage: 'Dataset settings',
  },
  delete_button: {
    id: 'collection.edit.info.delete',
    defaultMessage: 'Delete',
  },
  analyze_button: {
    id: 'collection.edit.info.analyze',
    defaultMessage: 'Re-process',
  },
  cancel_button: {
    id: 'collection.edit.info.cancel',
    defaultMessage: 'Cancel',
  },
  save_button: {
    id: 'collection.edit.info.save',
    defaultMessage: 'Save changes',
  },
  save_success: {
    id: 'collection.edit.save_success',
    defaultMessage: 'Your changes are saved.',
  },
});

// FIXME: Enable [jsx-a11y/label-has-associated-control] and [jsx-a11y/label-has-for] for this file
/* eslint-disable jsx-a11y/label-has-for, jsx-a11y/label-has-associated-control */
export class CollectionEditDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      collection: props.collection,
      blocking: false,
    };

    this.onSave = this.onSave.bind(this);
    this.onToggleRestricted = this.onToggleRestricted.bind(this);
    this.onSelectCountries = this.onSelectCountries.bind(this);
    this.onSelectLanguages = this.onSelectLanguages.bind(this);
    this.onSelectCreator = this.onSelectCreator.bind(this);
    this.onFieldChange = this.onFieldChange.bind(this);
  }

  static getDerivedStateFromProps(nextProps) {
    return { collection: nextProps.collection };
  }

  onFieldChange({ target }) {
    const { collection } = this.props;
    collection[target.id] = target.value;
    this.setState({ collection });
  }

  onToggleRestricted() {
    const { collection } = this.props;
    collection.restricted = !collection.restricted;
    this.setState({ collection });
  }

  onSelectCountries(countries) {
    const { collection } = this.props;
    collection.countries = countries;
    this.setState({ collection });
  }

  onSelectLanguages(languages) {
    const { collection } = this.props;
    collection.languages = languages;
    this.setState({ collection });
  }

  onSelectCreator(creator) {
    const { collection } = this.props;
    collection.creator = creator;
    this.setState({ collection });
  }

  async onSave() {
    const { intl } = this.props;
    const { collection, blocking } = this.state;
    if (blocking) return;
    this.setState({ blocking: true });

    try {
      await this.props.updateCollection(collection);
      showSuccessToast(intl.formatMessage(messages.save_success));
      this.props.toggleDialog();
      this.setState({ blocking: false });
    } catch (e) {
      showWarningToast(e.message);
      this.setState({ blocking: false });
    }
  }

  render() {
    const { intl, metadata, isAdmin } = this.props;
    const { collection, blocking } = this.state;
    const { categories, frequencies } = metadata;
    const isCasefile = collection.category === 'casefile';
    return (
      <FormDialog
        processing={blocking}
        icon="cog"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        title={intl.formatMessage(messages.title)}
        enforceFocus={false}
      >
        <div className="bp3-dialog-body">
          <div className="bp3-form-group">
            <label className="bp3-label">
              <FormattedMessage id="collection.edit.info.label" defaultMessage="Label" />
            </label>
            <div className="bp3-form-content">
              <input
                id="label"
                type="text"
                className="bp3-input bp3-fill"
                placeholder={intl.formatMessage(messages.placeholder_label)}
                onChange={this.onFieldChange}
                value={collection.label || ''}
              />
            </div>
          </div>
          { isAdmin && (
            <div className="bp3-form-group">
              <label className="bp3-label">
                <FormattedMessage id="collection.edit.info.category" defaultMessage="Category" />
              </label>
              <div className="bp3-select bp3-fill">
                <select id="category" onChange={this.onFieldChange} value={collection.category}>
                  {!collection.category && <option key="--" value="" selected>--</option>}
                  { Object.keys(categories).map(key => (
                    <option key={key} value={key}>
                      {categories[key]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="bp3-form-group">
            <label className="bp3-label">
              <FormattedMessage id="collection.edit.info.summary" defaultMessage="Summary" />
            </label>
            <div className="bp3-form-content">
              <textarea
                id="summary"
                className="bp3-input bp3-fill"
                placeholder={intl.formatMessage(messages.placeholder_summary)}
                rows={5}
                onChange={this.onFieldChange}
                value={collection.summary || ''}
              />
            </div>
          </div>
          { !isCasefile && (
            <>
              <div className="bp3-form-group">
                <label className="bp3-label">
                  <FormattedMessage id="collection.edit.info.publisher" defaultMessage="Publisher" />
                </label>
                <div className="bp3-fill">
                  <input
                    id="publisher"
                    type="text"
                    className="bp3-input bp3-fill"
                    placeholder={intl.formatMessage(messages.placeholder_publisher)}
                    onChange={this.onFieldChange}
                    value={collection.publisher || ''}
                  />
                </div>
              </div>
              <div className="bp3-form-group">
                <label className="bp3-label">
                  <FormattedMessage id="collection.edit.info.publisher_url" defaultMessage="Publisher URL" />
                </label>
                <div className="bp3-fill">
                  <input
                    id="publisher_url"
                    type="text"
                    className="bp3-input bp3-fill"
                    placeholder={intl.formatMessage(messages.placeholder_publisher_url)}
                    onChange={this.onFieldChange}
                    value={collection.publisher_url || ''}
                  />
                </div>
              </div>
              <div className="bp3-form-group">
                <label className="bp3-label">
                  <FormattedMessage id="collection.edit.info.info_url" defaultMessage="Information URL" />
                </label>
                <div className="bp3-fill">
                  <input
                    id="info_url"
                    type="text"
                    className="bp3-input bp3-fill"
                    placeholder={intl.formatMessage(messages.placeholder_info_url)}
                    onChange={this.onFieldChange}
                    value={collection.info_url || ''}
                  />
                </div>
              </div>
              <div className="bp3-form-group">
                <label className="bp3-label">
                  <FormattedMessage id="collection.edit.info.data_url" defaultMessage="Data source URL" />
                </label>
                <div className="bp3-fill">
                  <input
                    id="data_url"
                    type="text"
                    className="bp3-input bp3-fill"
                    placeholder={intl.formatMessage(messages.placeholder_data_url)}
                    onChange={this.onFieldChange}
                    value={collection.data_url || ''}
                  />
                </div>
              </div>
              <div className="bp3-form-group">
                <label className="bp3-label">
                  <FormattedMessage id="collection.edit.info.frequency" defaultMessage="Update frequency" />
                </label>
                <div className="bp3-select bp3-fill">
                  <select id="frequency" onChange={this.onFieldChange} value={collection.frequency || ''}>
                    { Object.keys(frequencies).map(key => (
                      <option key={key} value={key || ''}>
                        {frequencies[key]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
          { isAdmin && (
            <div className="bp3-form-group">
              <label className="bp3-label">
                <FormattedMessage id="collection.edit.info.creator" defaultMessage="Manager" />
              </label>
              <div className="bp3-form-content">
                <Role.Select
                  role={collection.creator}
                  onSelect={this.onSelectCreator}
                />
              </div>
            </div>
          )}
          <div className="bp3-form-group">
            <label className="bp3-label">
              <FormattedMessage id="collection.edit.info.countries" defaultMessage="Countries" />
            </label>
            <Country.MultiSelect
              onSubmit={this.onSelectCountries}
              values={collection.countries || []}
              inputProps={{
                inputRef: null,
                placeholder: intl.formatMessage(messages.placeholder_country),
              }}
            />
          </div>
          <div className="bp3-form-group">
            <label className="bp3-label">
              <FormattedMessage id="collection.edit.info.languages" defaultMessage="Languages" />
            </label>
            <Language.MultiSelect
              onSubmit={this.onSelectLanguages}
              values={collection.languages || []}
              inputProps={{
                inputRef: null,
                placeholder: intl.formatMessage(messages.placeholder_language),
              }}
            />
            <div className="bp3-form-helper-text">
              <FormattedMessage
                id="case.languages.helper"
                defaultMessage="Used for optical text recognition in non-Latin alphabets."
              />
            </div>
          </div>
          { !isCasefile && (
            <>
              <div className="bp3-form-group">
                <label className="bp3-label">
                  <FormattedMessage id="collection.edit.info.foreign_id" defaultMessage="Foreign ID" />
                </label>
                <div className="bp3-form-content">
                  <input
                    className="bp3-input bp3-fill"
                    type="text"
                    disabled
                    value={collection.foreign_id || ''}
                  />
                </div>
              </div>
              <div className="bp3-form-group">
                <div className="bp3-fill">
                  <Checkbox
                    checked={collection.restricted}
                    label={intl.formatMessage(messages.check_restricted)}
                    onChange={this.onToggleRestricted}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <div className="bp3-dialog-footer">
          <div className="bp3-dialog-footer-actions">
            <Button
              intent={Intent.PRIMARY}
              onClick={this.onSave}
              disabled={blocking}
              text={intl.formatMessage(messages.save_button)}
            />
          </div>
        </div>
      </FormDialog>
    );
  }
}

const mapStateToProps = state => ({
  metadata: selectMetadata(state),
  isAdmin: selectAdmin(state),
});

export default compose(
  connect(mapStateToProps, { updateCollection }),
  injectIntl,
)(CollectionEditDialog);
