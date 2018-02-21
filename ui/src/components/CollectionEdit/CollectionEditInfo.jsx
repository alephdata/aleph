import React, {Component} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, injectIntl} from 'react-intl';
import SuggestInput from 'src/components/common/SuggestInput';

import DualPane from 'src/components/common/DualPane';
import NamedMultiSelect from 'src/components/common/NamedMultiSelect';
import {fetchUsers} from "../../actions";

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
      listCategories: [],
      category: {},
      categoryName: '',
      contactName: '',
      listUsers: [],
      contact: {},
      collection: {}
    };

    this.onSelectCountry = this.onSelectCountry.bind(this);
    this.onSelectLanguage = this.onSelectLanguage.bind(this);
    this.onTyping = this.onTyping.bind(this);
    this.onSelectUser = this.onSelectUser.bind(this);
    this.onSelectCategory = this.onSelectCategory.bind(this);
    this.onFilterCategories = this.onFilterCategories.bind(this);
    this.onChangeLabel = this.onChangeLabel.bind(this);
    this.onChangeSummary = this.onChangeSummary.bind(this);
  }

  onSelectUser(user) {
    this.setState({contact: user});
    let collection = this.state.collection;
    collection.creator = user;
    this.setState({collection});
    this.props.onChangeCollection(collection);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.collection.isFetching === undefined) {
      this.setState({
        label: nextProps.collection.label,
        summary: nextProps.collection.summary === null ? '' : nextProps.collection.summary,
        countries: nextProps.collection.countries,
        listCountries: this.structureList(nextProps.countries),
        languages: nextProps.collection.languages,
        listLanguages: this.structureList(nextProps.languages),
        listCategories: this.structureList(nextProps.categories),
        listUsers: nextProps.users.results === undefined ? [] : nextProps.users.results,
        collection: nextProps.collection,
        categoryName: nextProps.collection === undefined ? undefined : nextProps.collection.category === undefined ? undefined : nextProps.collection.category,
        contactName: nextProps.collection === undefined ? undefined : nextProps.collection.creator === undefined ? nextProps.session.role.name : nextProps.collection.creator.name
      });
    }
  }

  async onTyping(query) {
    if(query.length >= 3) {
      await this.props.fetchUsers(query);
      this.setState({listUsers: this.props.users.results})
    } else {
      this.setState({listUsers: []})
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

  onSelectLanguage(languages) {
    this.setState({languages: languages.selectedItems, listLanguages: languages.list});
    let collection = this.state.collection;
    collection.languages = languages.selectedItems;
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

  onChangeLabel({target}) {
    this.setState({label: target.value});
    let collection = this.state.collection;
    collection.label = target.value;
    this.setState({collection});
    this.props.onChangeCollection(collection);
  }

  onChangeSummary({target}) {
    this.setState({summary: target.value})
    let collection = this.state.collection;
    collection.summary = target.value;
    this.setState({collection});
    this.props.onChangeCollection(collection);
  }

  render() {
    const {collection, intl, categories, session} = this.props;
    const {label, summary, listUsers, listCategories, listCountries, countries, listLanguages, languages, categoryName, contactName} = this.state;

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
                     onChange={this.onChangeLabel}
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
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.summart",
                       defaultMessage: "Enter summary of collection"
                     })}
                     dir="auto"
                        rows={5}
                     onChange={this.onChangeSummary}
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
              <SuggestInput
                isCategory={false}
                defaultValue={contactName}
                onSelectItem={this.onSelectUser}
                list={listUsers}
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
                <FormattedMessage id="collection.edit.info.countries" defaultMessage="Languages"/>
              </label>
            </div>
            <NamedMultiSelect
              onSelectItem={this.onSelectLanguage}
              list={listLanguages}
              selectedItems={languages}
              isCountry={false}/>
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
    languages: state.metadata.languages,
    categories: state.metadata.categories,
    users: state.users,
    session: state.session
  }
};

export default connect(mapStateToProps, {fetchUsers})(injectIntl(CollectionEditInfo));
