import React, { PureComponent, Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import c from 'classnames';

import { Collection, Entity } from 'src/components/common';
import DocumentSearch from 'src/components/Document/DocumentSearch';
import CollectionSearch from "src/components/Collection/CollectionSearch";

import './Breadcrumbs.css';

const messages = defineMessages({
  search_placeholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search…',
  }
});


class Breadcrumbs extends Component {
  render() {
    const { collection, children, document, hasSearchBar, sourceSearch, placeholder, queryPrefix } = this.props;

    let collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <CollectionBreadcrumb collection={collection} />
      ));
    }

    return (
      <nav className="Breadcrumbs">
        <ul className="pt-breadcrumbs">
          {collectionCrumbs}
          {children}
        </ul>
        <BreadcrumbSearch {...this.props} />
      </nav>
    );
  }
}


class BreadcrumbSearch extends Component {
  constructor(props) {
    super(props);
    this.state = {queryText: ''};
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
  }

  onSearchChange(e) {
    const queryText = (e.target.value && e.target.value.length > 0) ? e.target.value : null;
    this.setState({ queryText });
  }

  onSubmitSearch(event) {
    const { onSearch } = this.props;
    const { queryText } = this.state;
    event.preventDefault();
    if (onSearch) {
      onSearch(queryText);
    }
  }

  render() {
    const { intl, searchPlaceholder } = this.props;
    const { queryText } = this.state;
    const placeholder = searchPlaceholder || intl.formatMessage(messages.search_placeholder);
    const disabled = !this.props.onSearch;
    return (
      <form onSubmit={this.onSubmitSearch} className="BreadcrumbSearch search-box">
        <div className={c("pt-input-group", {"pt-disabled": disabled})}>
          <span className="pt-icon pt-icon-search"/>
          <input className="pt-input"
                 type="search"
                 dir="auto"
                 disabled={disabled}
                 placeholder={placeholder}
                 onChange={this.onSearchChange}
                 value={queryText || ''} />
        </div>
      </form>
    );
  }
}

BreadcrumbSearch = injectIntl(BreadcrumbSearch);


class CollectionBreadcrumb extends PureComponent {
  render() {
    const { collection } = this.props;
    return (
      <li key={collection.id}>
        <Collection.Link collection={collection} className="pt-breadcrumb" icon truncate={30} />
      </li>
    );
  }
}


class EntityBreadcrumb extends PureComponent {
  render() {
    const { entity } = this.props;
    return (
      <li key={entity.id}>
        <Entity.Link entity={entity} className="pt-breadcrumb" icon truncate={30} />
      </li>
    );
  }
}


class TextBreadcrumb extends PureComponent {
  render() {
    const { text } = this.props;
    if ( !text ) {
      return null;
    }
    return (
      <li key="text">
        <span className="pt-breadcrumb pt-breadcrumb-current">{text}</span>
      </li>
    );
  }
}


Breadcrumbs.Collection = CollectionBreadcrumb;
Breadcrumbs.Entity = EntityBreadcrumb;
Breadcrumbs.Text = TextBreadcrumb;
export default Breadcrumbs;
