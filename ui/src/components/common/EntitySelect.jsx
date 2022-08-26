import React, { Component } from 'react';
import { connect } from 'react-redux';
import { EntitySelect as VLEntitySelect } from 'react-ftm';

import { selectEntitiesResult } from 'selectors';

class EntitySelect extends Component {
  render() {
    const { buttonProps, noResultsText, onQueryChange, onSelect, result } =
      this.props;

    return (
      <VLEntitySelect
        allowMultiple={false}
        values={[]}
        entitySuggestions={result.results}
        isFetching={result.isPending}
        onSubmit={(entities) => onSelect(entities[0])}
        onQueryChange={onQueryChange}
        noResultsText={noResultsText}
        buttonProps={buttonProps}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;

  return {
    result: selectEntitiesResult(state, query),
  };
};

export default connect(mapStateToProps)(EntitySelect);
