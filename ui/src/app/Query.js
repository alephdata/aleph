import _ from 'lodash';
import queryString from 'query-string';
import ensureArray from 'util/ensureArray';
import { getGroupField } from 'components/SearchField/util';

class Query {
  // State of a particular API query. This doesn't need to be specific to any one
  // of the APIs (entities, documents, collections, roles), but just serves as a
  // container for the default syntax of Aleph.
  constructor(path, state, context = {}, queryName = '') {
    this.path = path;
    this.state = state;
    this.context = context;
    this.queryName = queryName;
    this.setPlain('limit', Query.LIMIT);
  }

  static LIMIT = 30;
  static LARGE = 200;
  static MAX_LIMIT = 9999;

  static fromLocation(path, location, context, queryName) {
    const state = queryString.parse(location.search);
    return new Query(path, state, context, queryName);
  }

  clone() {
    const state = _.cloneDeep(this.state);
    return new Query(this.path, state, this.context, this.queryName);
  }

  setPlain(name, value) {
    this.state[this.queryName + name] = ensureArray(value);
    return this;
  }

  set(name, value) {
    const child = this.clone();
    return this.setPlain.call(child, name, value);
  }

  setString(name, value) {
    return this.set(name, _.toString(value));
  }

  getList(name) {
    const fieldName = this.queryName + _.toString(name);
    const ctxValues = ensureArray(this.context[name]);
    const stateValues = ensureArray(this.state[fieldName]);
    return _.uniq(_.concat(ctxValues, stateValues));
  }

  getString(name) {
    return _.toString(_.head(this.getList(name)));
  }

  getInt(name, missing = 0) {
    if (!this.has(name)) {
      return missing;
    }
    return parseInt(this.getString(name), 10);
  }

  getBool(name, missing = false) {
    if (!this.has(name)) {
      return missing;
    }
    return this.getString(name) === 'true';
  }

  toggle(name, value) {
    const values = this.getList(name);
    return this.set(name, _.xor(values, [value]));
  }

  add(name, value) {
    const values = this.getList(name);
    return this.set(name, _.union(values, [value]));
  }

  remove(name, value) {
    const values = this.getList(name);
    return this.set(name, _.without(values, value));
  }

  clear(name) {
    return this.set(name, []);
  }

  has(name) {
    return this.getList(name).length !== 0;
  }

  hasFilter(name) {
    return this.has(`filter:${name}`);
  }

  hasQuery() {
    if (this.getString('q').length > 0) {
      return true;
    }
    if (this.getString('prefix').length > 0) {
      return true;
    }
    return false;
  }

  fields() {
    // List all the fields set for this query
    const keys = _.keys(this.context);
    _.keys(this.state).forEach((name) => {
      if (name.startsWith(this.queryName)) {
        keys.push(name.substr(this.queryName.length));
      }
    });
    return _.uniq(keys);
  }

  filters() {
    // List all the filters explictly active in this query
    // (i.e. not through the context)
    const fieldPrefix = `${this.queryName}filter:`;
    return _.keys(this.state)
      .filter(name => name.startsWith(fieldPrefix))
      .map(name => name.substr(fieldPrefix.length));
  }

  getFilter(name) {
    return this.getList(`filter:${name}`);
  }

  setFilter(name, value) {
    return this.set(`filter:${name}`, value);
  }

  toggleFilter(name, value) {
    return this.toggle(`filter:${name}`, value);
  }

  removeFilter(name, value) {
    return this.remove(`filter:${name}`, value);
  }

  removeAllFilters() {
    const state = _.cloneDeep(this.state);
    const filters = this.filters();

    const filterPrefix = `${this.queryName}filter:`;
    filters.forEach((filterName) => { state[`${filterPrefix}${filterName}`] = []; });

    return new Query(this.path, state, this.context, this.queryName);
  }

  clearFilter(name) {
    return this.clear(`filter:${name}`);
  }

  getSort() {
    if (!this.has('sort')) return {};
    // Currently only supporting sorting by a single field.
    const valueString = this.getString('sort');
    const [field, direction] = valueString.split(':');
    return { field, direction };
  }

  hasSort() {
    return this.has('sort');
  }

  sortBy(name, direction) {
    if (!name || !direction) {
      return this.clear('sort');
    }
    return this.set('sort', `${name}:${direction}`);
  }

  defaultSortBy(name, direction) {
    if (!this.hasSort()) {
      return this.sortBy(name, direction);
    }
    return this;
  }

  limit(count) {
    return this.set('limit', `${count}`);
  }

  offset(count) {
    return this.set('offset', `${count}`);
  }

  addFacet(facet) {
    const field = facet.isProperty ? `properties.${facet.name}` : facet.name;
    let newQuery = this.add('facet', field)
      .set(`facet_size:${field}`, facet.defaultSize || 10)
      .set(`facet_total:${field}`, true);

    if (field === 'dates' || facet.type === 'date') {
      newQuery = newQuery.add(`facet_interval:${field}`, 'year');
    }
    if (facet.isProperty) {
      newQuery = newQuery.set(`facet_type:${field}`, facet.type);
    }
    return newQuery;
  }

  removeFacet(facet) {
    const field = facet.isProperty ? `properties.${facet.name}` : facet.name;
    return this.remove('facet', field)
      .set(`facet_size:${field}`, undefined)
      .set(`facet_total:${field}`, undefined)
      .set(`facet_type:${field}`, undefined)
      .remove(`facet_interval:${field}`, 'year');
  }

  getFacetType(field) {
    const cleanedField = field.replace('gte:', '').replace('lte:', '').replace('eq:', '')
    return this.getString(`facet_type:${cleanedField}`);
  }

  hasFacet(field) {
    return this.getList('facet').indexOf(field) !== -1;
  }

  defaultFacet(field, total = false) {
    if (!this.hasFacet(field)) {
      return this.addFacet(getGroupField(field));
    }
    return this;
  }

  clearFacets() {
    return this.set('facet', []);
  }

  sameAs(other) {
    return this.toLocation() === other.toLocation()
      && queryString.stringify(this.context) === queryString.stringify(other.context)
      && this.path === other.path;
  }

  toLocation() {
    // Turn the state to a query string, but hiding the params implicit in the
    // context.
    return queryString.stringify(this.state);
  }

  toString() {
    // Return the full query string for this query, including implicit context.
    if (!this.path) { return undefined; }
    const query = queryString.stringify(this.toParams());
    return `${this.path}?${query}`;
  }

  toKey() {
    // Strip the parts of the query that are irrelevant to the result cache.
    return this
      .clear('offset')
      .clear('limit')
      .clear('next_limit')
      .toString();
  }

  toParams() {
    const params = {};
    this.fields().forEach((name) => {
      params[name] = this.getList(name);
    });
    return params;
  }
}

export default Query;
