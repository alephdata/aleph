import _ from 'lodash';
import queryString from 'query-string';

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
        const value = this.get(name);
        if (_.isEmpty(value)) {
            return [];
        }
        if (_.isString(value)) {
            return [value];
        }
        return _.sortedUniq(_.toArray(value));
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

    getFilters(name) {
        return this.getList('filter:' + name);
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

    sameAs(other) {
        return this.toLocation() === other.toLocation();
    }

    toLocation() {
        // turn the state to a query string.
        return queryString.stringify(this.state);
    }

    toParams() {
        return this.state;
    }
}

export default Query;