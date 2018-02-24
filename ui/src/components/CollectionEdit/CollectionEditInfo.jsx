import React, {Component} from 'react';
import {connect} from 'react-redux';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import SuggestInput from 'src/components/common/SuggestInput';

import DualPane from 'src/components/common/DualPane';
import NamedMultiSelect from 'src/components/common/NamedMultiSelect';
import {fetchRoles} from "src/actions";

import './CollectionEditInfo.css';

const messages = defineMessages({
  placeholder_label: {
    id: 'collection.edit.info.placeholder_label',
    defaultMessage: 'A label for this collection',
  },
  placeholder_summary: {
    id: 'collection.edit.info.placeholder_summary',
    defaultMessage: 'A brief summary of this collection',
  },
  placeholder_import_key: {
    id: 'collection.edit.info.placeholder_import_key',
    defaultMessage: 'Import ID',
  },
});

class CollectionEditInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      countries: [],
      languages: [],
      listCountries: [],
      listCategories: [],
      category: {},
      categoryName: '',
      contactName: '',
      listRoles: [],
      contact: {},
      collection: {}
    };

    this.onSelectCountry = this.onSelectCountry.bind(this);
    this.onTyping = this.onTyping.bind(this);
    this.onSelectRole = this.onSelectRole.bind(this);
    this.onSelectCategory = this.onSelectCategory.bind(this);
    this.onFilterCategories = this.onFilterCategories.bind(this);
    this.onFieldChange = this.onFieldChange.bind(this);
  }

  onSelectRole(role) {
    this.setState({contact: role});
    let collection = this.state.collection;
    collection.creator = role;
    this.setState({collection});
    this.props.onChangeCollection(collection);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.collection.isFetching) {
      return;
    }
    
    this.setState({
      countries: nextProps.collection.countries,
      listCountries: this.structureList(nextProps.countries),
      listCategories: this.structureList(nextProps.categories),
      listRoles: nextProps.roles === undefined ? [] : nextProps.roles.results === undefined ? [] : nextProps.roles.results,
      collection: nextProps.collection,
      categoryName: nextProps.collection === undefined ? undefined : nextProps.collection.category === undefined ? undefined : nextProps.collection.category,
      contactName: nextProps.collection === undefined ? undefined : nextProps.collection.creator === undefined ? nextProps.session.role.name : nextProps.collection.creator.name
    });
  }

  async onTyping(query) {
    if(query.length >= 3) {
      await this.props.fetchRoles(query);
      this.setState({listRoles: this.props.roles.results})
    } else {
      this.setState({listRoles: []})
    }

    this.setState({contactName: query})
  }

  structureList(list) {
    return Object.keys(list).map(function(k) {
      return {index:k, name:list[k]} });
  }

  onSelectCountry(countries) {
    this.setState({countries: countries.selectedItems, listCountries: countries.list});
    let collection = this.state.collection;
    collection.countries = countries.selectedItems;
    this.setState({collection});
    this.props.onChangeCollection(collection);
  }

  onSelectCategory(category) {
    this.setState({category: category});
    let collection = this.state.collection;
    collection.category = category.index;
    this.setState({collection});
    this.props.onChangeCollection(collection);
  }

  onFilterCategories(query) {
    let categoryList = [];
    let categories = this.structureList(this.props.categories);
    for(let i = 0; i < categories.length; i++) {
      if(categories[i].name.toLowerCase().includes(query)) {
        categoryList.push(categories[i]);
      }
    }

    this.setState({listCategories: categoryList, categoryName: query});
  }

  onFieldChange({target}) {
    const collection = this.props.collection;
    collection[target.id] = target.value;
    this.setState({collection});
    this.props.onChangeCollection(collection);
  }

  render() {
    const {collection, intl, categories} = this.props;
    const {listRoles, listCategories, listCountries, countries, categoryName, contactName} = this.state;

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
                     placeholder={intl.formatMessage(messages.placeholder_import_key)}
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
              <SuggestInput
                isCategory={false}
                defaultValue={contactName}
                onSelectItem={this.onSelectRole}
                list={listRoles}
                onTyping={this.onTyping}/>
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
                list={listCountries}
                selectedItems={countries}
                isCountry={true}/>
          </div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.categories" defaultMessage="Categories"/>
              </label>
            </div>
            <SuggestInput
              isCategory={true}
              defaultValue={categoryName}
              onSelectItem={this.onSelectCategory}
              list={listCategories}
              categories={categories}
              onTyping={this.onFilterCategories}/>
          </div>
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    countries: state.metadata.countries,
    categories: state.metadata.categories,
    roles: state.role,
    session: state.session,
  }
};

export default connect(mapStateToProps, {fetchRoles})(injectIntl(CollectionEditInfo));
