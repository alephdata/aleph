import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Namespace } from '@alephdata/followthemoney';
import { EntityManager } from '@alephdata/react-ftm';
import { queryExpand, queryEntitySuggest } from 'src/queries';
import { selectLocale, selectModel, selectEntitiesResult, selectExpandResult } from 'src/selectors';
import { createEntity, queryEntities, queryEntityExpand, updateEntity, updateEntitySet } from 'src/actions';
import updateStates from 'src/util/updateStates';

const entityEditorWrapper = (EditorComponent) => {
  const WrappedComponent = (
    class extends React.Component {
      constructor(props) {
        super(props);

        this.entityManager = new EntityManager({
          model: props.model,
          namespace: new Namespace(props.collection.foreign_id),
          pivotTypes: props.diagram?.settings?.pivotTypes,
          createEntity: this.createEntity.bind(this),
          expandEntity: this.expandEntity.bind(this),
          updateEntity: this.updateEntity.bind(this),
          updatePivotTypes: this.updatePivotTypes.bind(this),
          getEntitySuggestions: this.getEntitySuggestions.bind(this),
        });

        this.pendingPromises = [];
      }

      componentDidUpdate() {
        const { selectQueryResults } = this.props;

        // if there is an unresolved query promise, check if results have returned and resolve
        if (this.pendingPromises.length) {
          this.pendingPromises = this.pendingPromises.filter(({ query, promiseResolve }) => {
            const results = selectQueryResults(query);
            if (results) {
              promiseResolve(results);
              return false;
            }
            return true;
          });
        }
      }

      getEntitySuggestions(queryText, schema) {
        const { collection, location } = this.props;
        const query = queryEntitySuggest(location, collection, schema, queryText);

        // throttle entities query request
        clearTimeout(this.entitySuggestTimeout);
        this.entitySuggestTimeout = setTimeout(() => {
          this.props.queryEntities({ query });
        }, 150);

        return new Promise((resolve) => {
          this.pendingPromises.push({ query, promiseResolve: resolve });
        });
      }

      async createEntity(entity) {
        const { collection, onStatusChange } = this.props;
        onStatusChange(updateStates.IN_PROGRESS);
        try {
          await this.props.createEntity({ entity, collection_id: collection.id });
          onStatusChange(updateStates.SUCCESS);
        } catch {
          onStatusChange(updateStates.ERROR);
        }
        return null;
      }

      async expandEntity(entityId, properties, limit) {
        const { location } = this.props;
        const query = queryExpand(location, entityId, properties, limit);

        this.props.queryEntityExpand({ query });

        return new Promise((resolve) => {
          this.pendingPromises.push({ query, promiseResolve: resolve });
        });
      }

      async updateEntity(entity) {
        const { collection, onStatusChange } = this.props;
        onStatusChange(updateStates.IN_PROGRESS);

        try {
          entity.collection = collection;
          await this.props.updateEntity(entity);
          onStatusChange(updateStates.SUCCESS);
        } catch {
          onStatusChange(updateStates.ERROR);
        }
      }

      async updatePivotTypes(pivotTypes) {
        const { diagram, onStatusChange } = this.props;
        if (!diagram) return;

        onStatusChange(updateStates.IN_PROGRESS);
        const updatedDiagram = {...diagram, settings: { pivotTypes }};

        this.props.updateEntitySet(diagram.id, updatedDiagram)
          .then(() => {
            onStatusChange(updateStates.SUCCESS);
          })
          .catch(() => {
            onStatusChange(updateStates.ERROR);
          });
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
    let result;

    if (query.queryName === 'expand') {
      result = selectExpandResult(state, query);
    } else {
      result = selectEntitiesResult(state, query);
    }

    if (!result.isPending && result.results) {
      return result.results;
    }
    return null;
  },
});

const mapDispatchToProps = {
  createEntity,
  queryEntities,
  queryEntityExpand,
  updateEntity,
  updateEntitySet,
};

export default entityEditorWrapper;
