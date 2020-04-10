import React, { Component } from 'react';
// import c from 'classnames';
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
    // const { hideCollection = false, documentMode = false, showPreview = true } = this.props;

    // const skeletonItems = [...Array(15).keys()];

    console.log('rendering editor', isPending);

    return (
      <TableEditor
        entities={entities}
        schema={schema}
        entityManager={entityManager}
        sort={sort}
        sortColumn={sortColumn}
        selection={selection}
        updateSelection={updateSelection}
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
