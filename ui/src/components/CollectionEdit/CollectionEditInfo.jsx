import React, {Component} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, injectIntl} from 'react-intl';
import { Select } from "@blueprintjs/select";

import DualPane from 'src/components/common/DualPane';
import NamedMultiSelect from 'src/components/common/NamedMultiSelect';

import './CollectionEditInfo.css';

class CollectionEditInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      label: '',
      summary: '',
      countries: [],
      languages: [],
      listCountries: [],
      listLanguages: [],
      categories: []
    };

    this.onSelectCountry = this.onSelectCountry.bind(this);
    this.onSelectLanguage = this.onSelectLanguage.bind(this);
  }

  componentDidMount() {
    console.log('did mount', this.props)
  }

  componentWillReceiveProps(nextProps) {
    console.log('props');
    if (nextProps.collection.isFetching === undefined) {
      this.setState({
        label: nextProps.collection.label,
        summary: nextProps.collection.summary === null ? '' : nextProps.collection.summary,
        countries: nextProps.collection.countries,
        listCountries: this.structureList(nextProps.countries),
        languages: nextProps.collection.languages,
        listLanguages: this.structureList(nextProps.languages),
        categories: nextProps.categories
      });
    }
  }

  structureList(list) {
    return Object.keys(list).map(function(k) {
      return {index:k, name:list[k]} });
  }

  onSelectCountry(countries) {
    this.setState({countries: countries.selectedItems, listCountries: countries.list});
  }

  onSelectLanguage(languages) {
    this.setState({languages: languages.selectedItems, listLanguages: languages.list});
  }

  render() {
    const {collection, intl} = this.props;
    const {label, summary} = this.state;

    console.log(this.state.categories)

    return (
      <DualPane.InfoPane className="CollectionEditInfo">
        <h1>
          {collection === undefined ? '' : collection.label}
        </h1>
        <div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.label" defaultMessage="Label"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                     type="text"
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.label",
                       defaultMessage: "Enter name of collection"
                     })}
                     dir="auto"
                     onChange={this.onChangeName}
                     value={label}/>
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
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.import.key",
                       defaultMessage: "Import key"
                     })}
                     dir="auto"
                     disabled
                     value={collection === undefined ? '' : collection.foreign_id === undefined ? '' : collection.foreign_id}
              />
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
              <textarea className="pt-input input_class"
                     //type="text"
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.summart",
                       defaultMessage: "Enter summary of collection"
                     })}
                     dir="auto"
                        rows={5}
                     onChange={this.onChangeName}
                     value={summary}/>
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
              <input className="pt-input input_class"
                     type="text"
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.contact",
                       defaultMessage: "Enter name of contact"
                     })}
                     dir="auto"
                     onChange={this.onChangeName}
                     value= {collection === undefined ? '' : collection.creator === undefined ? '' : collection.creator}/>
            </div>
          </div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.countries" defaultMessage="Countries"/>
              </label>
            </div>
            <div className="pt-form-content">
              <NamedMultiSelect
                onSelectCountry={this.onSelectCountry}
                onRemoveCountry={this.onRemoveCountry}
                list={this.state.listCountries}
                selectedItems={this.state.countries}
                isCountry={true}/>
            </div>
          </div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.countries" defaultMessage="Languages"/>
              </label>
            </div>
            <NamedMultiSelect
              onSelectCountry={this.onSelectLanguage}
              onRemoveCountry={this.onRemoveLanguage}
              list={this.state.listLanguages}
              selectedItems={this.state.languages}
              isCountry={true}/>
          </div>
          {/*<div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.categories" defaultMessage="Categories"/>
              </label>
            </div>
            <Select
              items={this.state.categories}/>
          </div>*/}
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    countries: state.metadata.countries,
    languages: state.metadata.languages,
    categories: state.metadata.categories
  }
};

export default connect(mapStateToProps)(injectIntl(CollectionEditInfo));
