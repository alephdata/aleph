import React, {Component} from 'react';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';

import DualPane from 'src/components/common/DualPane';
import Role from 'src/components/common/Role';
import NamedMultiSelect from 'src/components/common/NamedMultiSelect';

import './CollectionEditInfo.css';

const messages = defineMessages({
  placeholder_label: {
    id: 'collection.edit.info.placeholder_label',
    defaultMessage: 'A label for this collection',
  },
  placeholder_summary: {
    id: 'collection.edit.info.placeholder_summary',
    defaultMessage: 'A brief summary of this collection',
  }
});

class CollectionEditInfo extends Component {
  constructor(props) {
    super(props);

    const countries = Object.keys(props.countries).map(function(k) {
      return {index:k, name:props.countries[k]}
    });
    this.state = {
      countries: countries,
      collection: props.collection,
    }

    this.onSelectCountry = this.onSelectCountry.bind(this);
    this.onSelectCreator = this.onSelectCreator.bind(this);
    this.onFieldChange = this.onFieldChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      collection: nextProps.collection
    });
  }

  onSelectCountry(countries) {
    const { collection } = this.props;
    collection.countries = countries.selectedItems;
    this.setState({collection: collection});
    this.props.onChangeCollection(collection);
  }

  onFieldChange({target}) {
    const { collection } = this.props;
    collection[target.id] = target.value;
    this.setState({collection: collection});
    this.props.onChangeCollection(collection);
  }

  onSelectCreator(creator) {
    const { collection } = this.props;
    collection.creator = creator;
    this.setState({collection: collection});
    this.props.onChangeCollection(collection);
  }

  render() {
    const {intl, categories} = this.props;
    const {collection} = this.state;

    return (
      <DualPane.InfoPane className="CollectionEditInfo">
        <div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.label" defaultMessage="Label"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input id="label"
                     className="pt-input input_class"
                     type="text"
                     placeholder={intl.formatMessage(messages.placeholder_label)}
                     dir="auto"
                     onChange={this.onFieldChange}
                     value={collection.label || ''}/>
            </div>
          </div>
          <div className="pt-form-group label_group">
            <div className='api_key_group'>
              <i className="fa fa-key" aria-hidden="true"/>
              <label className="pt-label api_key">
                Import ID
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                     type="text"
                     dir="auto"
                     disabled
                     value={collection.foreign_id || ''}
              />
            </div>
          </div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.category" defaultMessage="Category"/>
              </label>
            </div>
            <div className="pt-select pt-fill">
              <select id="category" onChange={this.onFieldChange} value={collection.category}>
                { Object.keys(categories).map((key) => (
                  <option key={key} value={key}>
                    {categories[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.summary" defaultMessage="Summary"/>
              </label>
            </div>
            <div className="pt-form-content">
              <textarea id="summary"
                        className="pt-input input_class"
                        placeholder={intl.formatMessage(messages.placeholder_summary)}
                        dir="auto"
                        rows={5}
                        onChange={this.onFieldChange}
                        value={collection.summary || ''}/>
            </div>
          </div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.contact" defaultMessage="Contact"/>
              </label>
            </div>
            <div className="pt-form-content">
              <Role.Select role={collection.creator}
                           onSelect={this.onSelectCreator} />
            </div>
          </div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.countries" defaultMessage="Countries"/>
              </label>
            </div>
            <NamedMultiSelect
              onSelectItem={this.onSelectCountry}
              list={this.state.countries}
              selectedItems={collection.countries}
              isCountry={true}/>
          </div>
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    countries: state.metadata.countries,
    categories: state.metadata.categories
  }
};

export default connect(mapStateToProps)(injectIntl(CollectionEditInfo));
