import React, { Component } from 'react';

import EntityListItem from './EntityListItem';

import './EntityList.css';

class EntityList extends Component {
  render() {
    const { result } = this.props;

    if (!result || !result.results) {
      return null;
    }
    

    return (
      <table className="results-table pt-table pt-bordered">
        <tbody>
          {result.results.map(item =>
            <EntityListItem {...this.props} key={item.id} item={item} />
          )}
        </tbody>
      </table>
    );
  }
}

export default EntityList;
