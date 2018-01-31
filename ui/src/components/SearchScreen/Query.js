import _ from 'lodash';
import queryString from 'query-string';
import ensureArray from 'src/util/ensureArray';

class Query {
    // State of a particular API query. This doesn't need to be specific to any one 
    // of the APIs (entities, documents, collections, roles), but just serves as a
    // container for the default syntax of Aleph.

    constructor (state, context, prefix) {
        this.state = state;
        this.context = context || {};
        this.prefix = prefix || '';
    }

    static fromLocation(location, context, prefix) {
        const state = queryString.parse(location.search);
        return new this(state, context, prefix);
    }

    clone(update) {
        const state = _.cloneDeep(this.state);
        return new Query(state, this.context, this.prefix);
    }

    set(name, value) {
        const child = this.clone();
        child.state[this.prefix + name] = ensureArray(value);
        return child;
    }

    setString(name, value) {
        return this.set(name, _.toString(value));
    }

    getList(name) {
        const prefixName = this.prefix + _.toString(name),
              ctxValues = ensureArray(this.context[name]),
              stateValues = ensureArray(this.state[prefixName]);
        return _.uniq(_.concat(ctxValues, stateValues));
    }

    getString(name) {
        return _.toString(_.head(this.getList(name)));
    }

    getQ() {
        return this.getString('q');
    }

    setQ(value) {
        return this.set('q', value);
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
        return 0 === this.getList(name).length;
    }

    hasFilter(name) {
        return this.has('filter:' + name);
    }

    hasQuery() {
        const query = this.getQ();
        return query.length > 0;
    }

    fields() {
        // List all the fields set for this query
        const keys = _.keys(this.context);
        _.keys(this.state).forEach((name) => {
            if (name.startsWith(this.prefix)) {
                name = name.substr(this.prefix.length);
                keys.push(name);
            }
        })
        return _.uniq(keys);
    }

    filters() {
      // List all the filters explictly active in this query
      // (i.e. not through the context)
      const keyPrefix = this.prefix + 'filter:';
      return _.keys(this.state)
        .filter(name => name.startsWith(keyPrefix))
        .map(name => name.substr(keyPrefix.length));
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

    limit(count) {
        return this.set('limit', count + '');
    }

    offset(count) {
        return this.set('offset', count + '');
    }

    addFacet(value) {
        return this.add('facet', value);
    }

    clearFacets() {
        return this.set('facet', []);
    }

    showUiFacet(name) {
        return this.add('uifacet', name);
    }

    hideUiFacet(name) {
        return this.remove('uifacet', name);
    }

    getUiFacets() {
        return this.getList('uifacet');
    }

    sameAs(other) {
        return this.toLocation() === other.toLocation()
            && queryString.stringify(this.context) === queryString.stringify(other.context);
    }

    toLocation() {
        // turn the state to a query string.
        return queryString.stringify(this.state);
    }

    toParams() {
        let params = {};
        this.fields().forEach((name) => {
            params[name] = this.getList(name);
        })

        // convert all filters which are being faceted on into post-filters.
        this.getList('facet').forEach((facet) => {
            let srcFilter = 'filter:' + facet,
                dstFilter = 'post_' + srcFilter;
            params[dstFilter] = _.uniq(ensureArray(params[srcFilter]),
                                       ensureArray(params[dstFilter]));
            delete params[srcFilter];
        })
        return params;
    }
}

export default Query;