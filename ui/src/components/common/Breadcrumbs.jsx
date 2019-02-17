import React, {PureComponent, Component} from 'react';
import {connect} from 'react-redux';
import {defineMessages, injectIntl} from 'react-intl';
import c from 'classnames';

import {Collection, Entity} from 'src/components/common';
import './Breadcrumbs.scss';
import {selectEntity} from "src/selectors";
import {fetchEntity} from "src/actions";

const messages = defineMessages({
  search_placeholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search…',
  }
});


class Breadcrumbs extends Component {
  render() {
    const {collection, children} = this.props;

    let collectionCrumbs = [];
    if (collection) {
      collectionCrumbs.push((
        <CollectionBreadcrumb collection={collection}/>
      ));
    }

    return (
      <nav className="Breadcrumbs">
        <ul className="bp3-breadcrumbs">
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
    this.state = {};
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.searchText !== prevState.searchText) {
      return {
        searchText: nextProps.searchText,
        queryText: nextProps.searchText
      };
    }
    return {};
  }

  onSearchChange(e) {
    const queryText = (e.target.value && e.target.value.length > 0) ? e.target.value : null;
    this.setState({queryText});
  }

  onSubmitSearch(event) {
    const {onSearch} = this.props;
    const {queryText} = this.state;
    event.preventDefault();
    if (onSearch) {
      onSearch(queryText);
    }
  }

  render() {
    const {intl, searchPlaceholder} = this.props;
    const {queryText} = this.state;
    const placeholder = searchPlaceholder || intl.formatMessage(messages.search_placeholder);
    if (!this.props.onSearch) {
      return null;
    }
    return (
      <form onSubmit={this.onSubmitSearch} className="BreadcrumbSearch search-box">
        <div className={c("bp3-input-group")}>
          <span className="bp3-icon bp3-icon-search"/>
          <input className="bp3-input"
                 type="search"
                 dir="auto"
                 placeholder={placeholder}
                 onChange={this.onSearchChange}
                 value={queryText || ''}/>
        </div>
      </form>
    );
  }
}

BreadcrumbSearch = injectIntl(BreadcrumbSearch);


class CollectionBreadcrumb extends PureComponent {
  render() {
    const {collection} = this.props;
    return (
      <li key={collection.id}>
        <Collection.Link collection={collection} className="bp3-breadcrumb" icon truncate={30}/>
      </li>
    );
  }
}

class EntityBreadcrumb extends PureComponent {
  fetchIfNeeded([id, entity]){
    if(entity.shouldLoad){
      return !this.props.fetchEntity({id});
    } else return !entity.isLoading;
  }
  render() {
    const {entity} = this.props;
    return (<React.Fragment>
        {this.props.parents
          .filter(parent => this.fetchIfNeeded(parent))
          .map(parent=> <Breadcrumbs.Entity key={parent[0]} entity={parent[1]}/>)
        }
        <li key={entity.id}>
          <Entity.Link entity={entity} className="bp3-breadcrumb" icon truncate={30}/>
        </li>
      </React.Fragment>
    );
  }
}


class TextBreadcrumb extends PureComponent {
  render() {
    const {text} = this.props;
    if (!text) {
      return null;
    }
    return (
      <li key="text">
        <span className="bp3-breadcrumb bp3-breadcrumb-current">{text}</span>
      </li>
    );
  }
}

const mapStateToProps = (state, {entity, discovery=true}) => {
  const parentsProp = entity.getProperty('parent');
  let parents = [];
  if (!parentsProp.isEmpty() && discovery) {
    parents = parentsProp.values
      .map(parent => [parent.id, selectEntity(state, parent.id)])
  }
  return ({
    parents
  });
};

Breadcrumbs.Collection = CollectionBreadcrumb;
Breadcrumbs.Entity = connect(mapStateToProps, {fetchEntity})(EntityBreadcrumb);
Breadcrumbs.Text = TextBreadcrumb;
export default Breadcrumbs;
