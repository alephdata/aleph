import React, { Component } from 'react';
// import c from 'classnames';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { EntityManager, TableEditor } from '@alephdata/vislib';
import { selectModel } from 'src/selectors';
import queryString from 'query-string';
import { createEntity, queryEntities, updateEntity } from 'src/actions';


class EntityTableEditor extends Component {
  constructor(props) {
    super(props);

    this.entityManager = new EntityManager({
      model: props.model,
      createEntity: this.createEntity.bind(this),
      updateEntity: this.updateEntity.bind(this),
      getEntitySuggestions: this.getEntitySuggestions.bind(this),
    });
  }
  
  async updateEntity(entity) {
    try {
      await this.props.updateEntity({ entity, collectionId: entity.collection.id });
    } catch {

    }
  }

  render() {
    const { entities, isPending, location, sort, sortColumn, schema, selection, updateSelection } = this.props;
    // const { hideCollection = false, documentMode = false, showPreview = true } = this.props;

    const skeletonItems = [...Array(15).keys()];

    console.log('rendering editor');

    return (
      <TableEditor
        entities={entities}
        schema={schema}
        updateEntity={this.updateEntity}
        sort={sort}
        sortColumn={sortColumn}
        selection={selection}
        updateSelection={updateSelection}
        fullEntitiesList={[]}
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
)(EntityTableEditor);
