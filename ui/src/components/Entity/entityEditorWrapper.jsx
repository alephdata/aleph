import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Namespace } from '@alephdata/followthemoney';
import { EntityManager } from '@alephdata/react-ftm';
import { entityExpandQuery, entitySuggestQuery } from 'queries';
import { selectLocale, selectModel, selectEntitiesResult, selectEntityExpandResult } from 'selectors';
import {
  createEntity,
  deleteEntity,
  entitySetAddEntity,
  updateEntitySetItemNoMutate,
  queryEntities,
  queryEntityExpand,
  updateEntity
} from 'actions';
import { UpdateStatus } from 'components/common';

const entityEditorWrapper = (EditorComponent) => {
  const WrappedComponent = (
    class extends React.Component {
      constructor(props) {
        super(props);

        this.namespace = new Namespace(props.collection.foreign_id);

        this.context = new AlephEntityContext({
          selectModel,
          selectLocale,
          createEntity: this.createEntity.bind(this),
          updateEntity: this.updateEntity.bind(this),
          deleteEntity: this.deleteEntity.bind(this),
          selectEntity,
          selectEntities: this.selectEntities.bind(this),
          queryEntities: this.queryEntities.bind(this),
          queryEntitySuggest: this.queryEntitySuggest.bind(this),
          selectEntitiesResult:
          // queryEntityExpand: this.queryEntityExpand.bind(this),
          // selectEntityExpandResult:
        });
      }

      async createEntity(model, entityData) {
        const { collection, entitySetId, onStatusChange } = this.props;
        onStatusChange && onStatusChange(UpdateStatus.IN_PROGRESS);

        let entity;
        if (entityData.id) {
          entity = model.getEntity(entityData);
        } else {
          const { properties, schema } = entityData;
          entity = model.createEntity(schema);
          if (properties) {
            Object.entries(properties).forEach(([prop, value]: [string, any]) => {
              if (Array.isArray(value)) {
                value.forEach(v => entity.setProperty(prop, v));
              } else {
                entity.setProperty(prop, value);
              }
            });
          }
        }

        try {
          if (entitySetId) {
            await this.props.entitySetAddEntity({ entity, entitySetId, sync: true });
          } else {
            await this.props.createEntity({ entity, collection_id: collection.id });
          }
          onStatusChange && onStatusChange(UpdateStatus.SUCCESS);
        } catch {
          onStatusChange && onStatusChange(UpdateStatus.ERROR);
        }
        return entity;
      }

      async updateEntity(entity) {
        const { collection, onStatusChange } = this.props;
        onStatusChange && onStatusChange(UpdateStatus.IN_PROGRESS);

        try {
          entity.collection = collection;
          await this.props.updateEntity(entity);
          onStatusChange && onStatusChange(UpdateStatus.SUCCESS);
        } catch {
          onStatusChange && onStatusChange(UpdateStatus.ERROR);
        }
      }

      async deleteEntity(entityId) {
        const { entitySetId, onStatusChange } = this.props;

        onStatusChange && onStatusChange(UpdateStatus.IN_PROGRESS);

        try {
          if (entitySetId) {
            await this.props.updateEntitySetItemNoMutate({
              entityId,
              entitySetId,
              judgement: 'no_judgement'
            });
          } else {
            await this.props.deleteEntity(entityId);
          }
          onStatusChange && onStatusChange(UpdateStatus.SUCCESS);
        } catch {
          onStatusChange && onStatusChange(UpdateStatus.ERROR);
        }
      }

      selectEntities(state, ids) {
        const { query } = this.props;
        return selectEntitiesResult(state, this.generateQuery('all'));
      }

      queryEntities(queryText, schemata) {
        const { query } = this.props;
        const newQuery = query
          .setFilter('schemata', schemata);
          .set('prefix', queryText);

        this.props.queryEntities(newQuery);
      }

      queryEntitySuggest(queryText, schemata) {
        const { collection, location } = this.props;
        const query = entitySuggestQuery(location, collection, schemata, { prefix: queryText });

        // // throttle entities query request
        clearTimeout(this.entitySuggestTimeout);
        this.entitySuggestTimeout = setTimeout(() => {
          this.props.queryEntities({ query });
        }, 150);
      }

      // selectEntitiesResult(state, queryText, schemata) {
      //
      // }


      //
      queryEntityExpand(entityId, properties, limit) {
        const query = entityExpandQuery(entityId, properties, limit);
        this.props.queryEntityExpand({ query });
      }

      selectEntityExpandResult(state, entityId, properties, limit) {

      }

      generateQuery(queryName, ) {
        const { query } = this.props;
        switch(queryName) {
          case 'all':
            return query;
        }
      }

      render() {
        // return editor component with entityManager
        return (
          <EditorComponent
            entityContext={this.entityContext}
            {...this.props}
          />
        );
      }
    }
  );
  return compose(
    withRouter,
    connect(mapStateToProps, mapDispatchToProps),
  )(WrappedComponent);
}

const mapStateToProps = (state, ownProps) => {
  const { match } = ownProps;
  const { entitySetId } = match.params;

  return ({
    model: selectModel(state),
    locale: selectLocale(state),
    entitySetId,
    selectQueryResults: (query) => {
      let result;

      if (query.queryName === 'expand') {
        result = selectEntityExpandResult(state, query);
      } else {
        result = selectEntitiesResult(state, query);
      }

      if (!result.isPending && result.results) {
        return result.results;
      }
      return null;
    },
  });
}

const mapDispatchToProps = {
  createEntity,
  deleteEntity,
  entitySetAddEntity,
  updateEntitySetItemNoMutate,
  queryEntities,
  queryEntityExpand,
  updateEntity,
};

export default entityEditorWrapper;
