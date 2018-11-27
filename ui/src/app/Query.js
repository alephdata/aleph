import _ from 'lodash';
import queryString from 'query-string';
import ensureArray from 'src/util/ensureArray';

class Query {
  // State of a particular API query. This doesn't need to be specific to any one 
  // of the APIs (entities, documents, collections, roles), but just serves as a
  // container for the default syntax of Aleph.

  constructor (path, state, context = {}, queryName = '') {
    this.path = path;
    this.state = state;
    this.context = context;
    this.queryName = queryName;
  }

  static fromLocation(path, location, context, queryName) {
    const state = queryString.parse(location.search);
    return new Query(path, state, context, queryName);
  }

  clone(update) {
    const state = _.cloneDeep(this.state);
    return new Query(this.path, state, this.context, this.queryName);
  }

  set(name, value) {
    const child = this.clone();
    child.state[this.queryName + name] = ensureArray(value);
    return child;
  }

  setString(name, value) {
    return this.set(name, _.toString(value));
  }

  getList(name) {
    const fieldName = this.queryName + _.toString(name),
        ctxValues = ensureArray(this.context[name]),
        stateValues = ensureArray(this.state[fieldName]);
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
    let values = this.getList(name);
    return this.set(name, _.xor(values, [value]));
  }

  add(name, value) {
    let values = this.getList(name);
    return this.set(name, _.union(values, [value]));
  }

  remove(name, value) {
    let values = this.getList(name);
    return this.set(name, _.without(values, value));
  }

  clear(name) {
    return this.set(name, []);
  }

  has(name) {
    return this.getList(name).length !== 0;
  }

  hasFilter(name) {
    return this.has('filter:' + name);
  }

  hasQuery() {
    if (this.getString('q').length > 0) {
      return true
    }
    if (this.getString('prefix').length > 0) {
      return true
    }
    return false;
  }

  fields() {
    // List all the fields set for this query
    const keys = _.keys(this.context);
    _.keys(this.state).forEach((name) => {
      if (name.startsWith(this.queryName)) {
        name = name.substr(this.queryName.length);
        keys.push(name);
      }
    });
    return _.uniq(keys);
  }

  filters() {
    // List all the filters explictly active in this query
    // (i.e. not through the context)
    const fieldPrefix = this.queryName + 'filter:';
    return _.keys(this.state)
    .filter(name => name.startsWith(fieldPrefix))
    .map(name => name.substr(fieldPrefix.length));
  }

  getFilter(name) {
    return this.getList('filter:' + name);
  }

  setFilter(name, value) {
    return this.set('filter:' + name, value);
  }

  toggleFilter(name, value) {
    return this.toggle('filter:' + name, value);
  }

  removeFilter(name, value) {
    return this.remove('filter:' + name, value);
  }

  clearFilter(name) {
    return this.clear('filter:' + name);
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
    return this.set('sort', `${name}:${direction}`)
  }

  limit(count) {
    return this.set('limit', count + '');
  }

  offset(count) {
    return this.set('offset', count + '');
  }

  addFacet(value) {
    return this.add('facet', value);
  }

  hasFacet(value) {
    return this.getList('facet').indexOf(value) !== -1;
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
