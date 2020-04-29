import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { TableEditor } from '@alephdata/vislib';
import { selectModel } from 'src/selectors';
import queryString from 'query-string';
import entityEditorWrapper from 'src/components/Entity/entityEditorWrapper';


class EntityTableEditor extends Component {
  render() {
    const { entities, entityManager, isPending, sort, sortColumn, schema, selection, updateSelection } = this.props;

    const trimmedSort = sort?.field
      ? {
        field: sort.field.replace('properties.', ''),
        direction: sort.direction,
      } : sort;

    return (
      <TableEditor
        entities={entities}
        schema={schema}
        entityManager={entityManager}
        sort={trimmedSort}
        sortColumn={newField => sortColumn(`properties.${newField}`)}
        selection={selection}
        updateSelection={updateSelection}
        writeable={true}
        isPending={isPending}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const model = selectModel(state);
  const schema = model.getSchema(hashQuery.type);

  return { schema };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  entityEditorWrapper,
)(EntityTableEditor);
