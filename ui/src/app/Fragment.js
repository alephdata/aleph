import _ from 'lodash';
import queryString from 'query-string';

class Fragment {
  constructor(history) {
    this.location = history.location;
    this.state = queryString.parse(history.location.hash);
    this.history = history;
  }

  get(name) {
    return this.state[name];
  }

  update(newState) {
    const state = _.assign({}, this.state, newState);
    this.history.replace({
      hash: queryString.stringify(state),
      search: this.location.search,
      pathname: this.location.pathname
    });
  }
}

export default Fragment;