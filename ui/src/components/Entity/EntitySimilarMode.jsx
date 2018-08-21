import React, { Component } from 'react';

import EntitySearch from 'src/components/EntitySearch/EntitySearch';

import './EntitySimilarMode.css';


class EntitySimilarMode extends Component {
  render() {
    const { query } = this.props;
    return (
      <section className='EntitySimilarMode'>
        <EntitySearch query={query} />
      </section>
    );
  }
}

export default EntitySimilarMode;
