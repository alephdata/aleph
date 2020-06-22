import React, { Component } from 'react';
import { connect } from 'react-redux';
import { EntitySelect as VLEntitySelect } from '@alephdata/react-ftm';

import { selectEntitiesResult } from 'src/selectors';

class EntitySelect extends Component {
  render() {
    const { onQueryChange, onSelect, result } = this.props;

    return (
      <VLEntitySelect
        allowMultiple={false}
        values={[]}
        entitySuggestions={result.results}
        isFetching={result.shouldLoad || result.isLoading}
        onSubmit={entities => onSelect(entities[0])}
        onQueryChange={onQueryChange}
      />
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;

  console.log('query is', query, query.context.prefix);
  console.log('state is', state);

  return {
    result: selectEntitiesResult(state, query),
  };
};


export default connect(mapStateToProps)(EntitySelect);
