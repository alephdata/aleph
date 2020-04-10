import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { EntityManager } from '@alephdata/vislib';
import { processApiEntity } from 'src/components/Diagram/util';
import { queryEntitySuggest } from 'src/queries';
import { selectLocale, selectModel, selectEntitiesResult } from 'src/selectors';
import { createEntity, queryEntities, updateEntity } from 'src/actions';
import updateStates from 'src/components/Diagram/diagramUpdateStates';

const entityEditorWrapper = (EditorComponent) => {
  const WrappedComponent = (
    class extends React.Component {
      constructor(props) {
        super(props);

        this.entityManager = new EntityManager({
          model: props.model,
          createEntity: this.createEntity.bind(this),
          updateEntity: this.updateEntity.bind(this),
          getEntitySuggestions: this.getEntitySuggestions.bind(this),
        });
      }

      componentDidUpdate(prevProps) {
        const { selectQueryResults } = this.props;

        // if there is an unresolved query promise, check if results have returned and resolve
        if (this.entitySuggestPromise) {
          const { query, promiseResolve } = this.entitySuggestPromise;
          const results = selectQueryResults(query);
          if (results) {
            this.entitySuggestPromise = null;
            promiseResolve(results);
          }
        }
      }

      getEntitySuggestions(queryText, schema) {
        const { collection, location, selectQueryResults } = this.props;
        const query = queryEntitySuggest(location, collection, schema, queryText);

        // check if query results are in results cache
        const results = selectQueryResults(query);
        if (results) {
          this.entitySuggestPromise = null;
          return results;
        }

        // throttle entities query request
        clearTimeout(this.entitySuggestTimeout);
        this.entitySuggestTimeout = setTimeout(() => {
          this.props.queryEntities({ query });
        }, 150);

        return new Promise((resolve) => {
          this.entitySuggestPromise = { query, promiseResolve: resolve };
        });
      }

      async createEntity({ schema, properties }) {
        const { collection, onStatusChange } = this.props;
        onStatusChange(updateStates.IN_PROGRESS);

        try {
          const entityData = await this.props.createEntity({
            schema: schema.name,
            properties: properties || {},
            collection,
          });
          onStatusChange(updateStates.SUCCESS);

          return processApiEntity(entityData);
        } catch {
          onStatusChange(updateStates.ERROR);
        }
        return null;
      }

      async updateEntity(entity) {
        const { collection, onStatusChange } = this.props;
        onStatusChange(updateStates.IN_PROGRESS);

        try {
          await this.props.updateEntity({ entity, collectionId: collection.id });
          onStatusChange(updateStates.SUCCESS);
        } catch {
          onStatusChange(updateStates.ERROR);
        }
      }

      render() {
        // return editor component with entityManager
        return (
          <EditorComponent
            entityManager={this.entityManager}
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

const mapStateToProps = state => ({
  model: selectModel(state),
  locale: selectLocale(state),
  selectQueryResults: (query) => {
    const result = selectEntitiesResult(state, query);
    if (!result.isPending && result.results) {
      return result.results;
    }
    return null;
  },
});

const mapDispatchToProps = {
  createEntity,
  queryEntities,
  updateEntity,
};

export default entityEditorWrapper;
