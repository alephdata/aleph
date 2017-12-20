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
          {result.results.map(item => <EntityListItem key={item.id} result={item} />)}
        </tbody>
      </table>
    );
  }
}

export default EntityList;
