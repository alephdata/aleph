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

    getField(name) {
        return this.state[this.prefix + name];
    }

    getString(name) {
        return _.toString(this.getField(name));
    }

    getList(name) {
        const value = this.getField(name);
        if (_.isString(value)) {
            return [value];
        }
        return _.toArray(value);
    }

    has(name) {
        return !_.isEmpty(this.getField(name));
    }

    hasFilter(name) {
        return this.has('filter:' + name);
    }

    getFilters(name) {
        return this.getList('filter:' + name);
    }

    serialize() {
        // turn the state to a query string.
        return queryString.stringify(this.state);
    }
}

export default Query;