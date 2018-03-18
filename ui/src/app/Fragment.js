import _ from 'lodash';
import queryString from 'query-string';


class Fragment {

  constructor (location, history) {
    this.location = location;
    this.state = queryString.parse(location.hash);
    this.history = history;
  }

  static fromLocation(location, history) {
    return new this(location, history);
  }

  get(name) {
    return this.state[name];
  }

  update(newState) {
    const state = _.assign({}, this.state, newState);
    this.history.replace({
      hash: queryString.stringify(state),
    });
  }
}

export default Fragment;