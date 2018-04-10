import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Dialog, Button, Intent } from '@blueprintjs/core';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { Role, Country } from 'src/components/common';
import { showSuccessToast } from "src/app/toast";
import { updateCollection } from "src/actions";

const messages = defineMessages({
  placeholder_label: {
    id: 'collection.edit.info.placeholder_label',
    defaultMessage: 'A label for this source',
  },
  placeholder_summary: {
    id: 'collection.edit.info.placeholder_summary',
    defaultMessage: 'A brief summary of this source',
  },
  title : {
    id: 'collection.edit.title',
    defaultMessage: 'Source settings'
  },
  save_button: {
    id: 'collection.edit.info.save',
    defaultMessage: 'Save changes',
  },
  save_success: {
    id: 'collection.edit.save_success',
    defaultMessage: 'Your changes are saved.',
  },
  save_error: {
    id: 'collection.edit.save_error',
    defaultMessage: 'Failed to save changes.',
  }
});


class CollectionEditDialog extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collection: props.collection,
    };

    this.onSave = this.onSave.bind(this);
    this.onSelectCountries = this.onSelectCountries.bind(this);
    this.onSelectCreator = this.onSelectCreator.bind(this);
    this.onFieldChange = this.onFieldChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      collection: nextProps.collection
    });
  }

  onFieldChange({target}) {
    const { collection } = this.props;
    collection[target.id] = target.value;
    this.setState({collection: collection});
  }

  onSelectCountries(countries) {
    const { collection } = this.props;
    collection.countries = countries;
    this.setState({collection: collection});
  }

  onSelectCreator(creator) {
    const { collection } = this.props;
    collection.creator = creator;
    this.setState({collection: collection});
  }

  async onSave() {
    const { intl } = this.props;
    const { collection } = this.state;

    try {
      await this.props.updateCollection(collection);
      showSuccessToast(intl.formatMessage(messages.save_success));
      this.props.toggleDialog();
    } catch (e) {
      alert(intl.formatMessage(messages.save_error));
    }
  }

  render() {
    const { intl, categories } = this.props;
    const { collection } = this.state;
    return (
      <Dialog
        icon="cog"
        isOpen={this.props.isOpen}
        onClose={this.props.toggleDialog}
        title={intl.formatMessage(messages.title)}>
        <div className="pt-dialog-body">
          <div className="pt-form-group">
              <label className="pt-label">
                <FormattedMessage id="collection.edit.info.label" defaultMessage="Label"/>
              </label>
            <div className="pt-form-content">
              <input id="label"
                     className="pt-input pt-large pt-fill"
                     type="text"
                     placeholder={intl.formatMessage(messages.placeholder_label)}
                     dir="auto"
                     onChange={this.onFieldChange}
                     value={collection.label || ''}/>
            </div>
          </div>
          <div className="pt-form-group">
              <label className="pt-label">
                <FormattedMessage id="collection.edit.info.category" defaultMessage="Category"/>
              </label>
            <div className="pt-select pt-fill">
              <select id="category" onChange={this.onFieldChange} value={collection.category}>
                {!collection.category && <option key='--' value='' selected>--</option>}
                { Object.keys(categories).map((key) => (
                  <option key={key} value={key}>
                    {categories[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-form-group">
              <label className="pt-label">
                <FormattedMessage id="collection.edit.info.summary" defaultMessage="Summary"/>
              </label>
            <div className="pt-form-content">
              <textarea id="summary"
                        className="pt-input pt-fill"
                        placeholder={intl.formatMessage(messages.placeholder_summary)}
                        dir="auto"
                        rows={5}
                        onChange={this.onFieldChange}
                        value={collection.summary || ''}/>
            </div>
          </div>
          <div className="pt-form-group">
              <label className="pt-label">
                <FormattedMessage id="collection.edit.info.contact" defaultMessage="Contact"/>
              </label>
            <div className="pt-form-content">
              <Role.Select role={collection.creator}
                           onSelect={this.onSelectCreator} />
            </div>
          </div>
          <div className="pt-form-group">
              <label className="pt-label">
                <FormattedMessage id="collection.edit.info.countries" defaultMessage="Countries"/>
              </label>
            <Country.MultiSelect
              onChange={this.onSelectCountries}
              codes={collection.countries} />
          </div>
          <div className="pt-form-group">
              <label className="pt-label">
                <FormattedMessage id="collection.edit.info.import.id" defaultMessage="Import ID"/>
              </label>
            <div className="pt-form-content">
              <input className="pt-input pt-fill"
                     type="text"
                     dir="auto"
                     disabled
                     value={collection.foreign_id || ''}
              />
            </div>
          </div>
        </div>
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            <Button
              intent={Intent.PRIMARY}
              onClick={this.onSave}
              text={intl.formatMessage(messages.save_button)}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    categories: state.metadata.categories
  };
};

export default connect(mapStateToProps, {updateCollection})(injectIntl(CollectionEditDialog));
