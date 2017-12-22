import _ from 'lodash';
import queryString from 'query-string';

function ensureArray(value) {
    if (_.isEmpty(value)) {
        return [];
    }
    if (_.isString(value)) {
        return [value];
    }
    return _.sortedUniq(_.toArray(value));
}

class Query {
    // State of a particular API query. This doesn't need to be specific to any one 
    // of the APIs (entities, documents, collections, roles), but just serves as a
    // container for the default syntax of Aleph.

    constructor (state, prefix) {
        this.state = state;
        this.prefix = prefix || '';
    }

    static fromLocation(location, prefix) {
        const state = queryString.parse(location.search);
        return new this(state, prefix);
    }

    clone(update) {
        return new Query(_.cloneDeep(this.state), this.prefix);
    }

    get(name) {
        return this.state[this.prefix + name];
    }

    set(name, value) {
        let child = this.clone();
        child.state[this.prefix + name] = value;
        return child;
    }

    getString(name) {
        return _.toString(this.get(name));
    }

    setString(name, value) {
        return this.set(name, _.toString(value));
    }

    getQ() {
        return this.getString('q');
    }

    setQ(value) {
        return this.setString('q', value);
    }

    getList(name) {
        return ensureArray(this.get(name));
    }

    toggle(name, value) {
        let values = this.getList(name);
        return this.set(name, _.xor(values, [value]));
    }

    add(name, value) {
        let values = this.getList(name);
        return this.set(name, _.union(values, [value]));
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

    getFilter(name) {
        return this.getList('filter:' + name);
    }

    setFilter(name, value) {
        return this.set('filter:' + name, value);
    }

    toggleFilter(name, value) {
        return this.toggle('filter:' + name, value);
    }

    limit(count) {
        return this.set('limit', count);
    }

    offset(count) {
        return this.set('offset', count);
    }

    addFacet(value) {
        return this.add('facet', value);
    }

    clearFacets() {
        return this.set('facet', []);
    }

    sameAs(other) {
        return this.toLocation() === other.toLocation();
    }

    toLocation() {
        // turn the state to a query string.
        return queryString.stringify(this.state);
    }

    toParams() {
        const facets = this.getList('facet');
        let params = {};
        Object.entries(this.state).forEach(([name, value]) => {
            if (name.startsWith(this.prefix)) {
                name = name.substr(this.prefix.length);
                params[name] = value;
            }
        })
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