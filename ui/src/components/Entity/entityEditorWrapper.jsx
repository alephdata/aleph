import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Namespace } from '@alephdata/followthemoney';
import { EntityManager } from '/src/react-ftm/index.ts';

import withRouter from '/src/app/withRouter.jsx';
import { entityExpandQuery, entitySuggestQuery } from '/src/queries.js';
import {
  selectLocale,
  selectModel,
  selectEntitiesResult,
  selectEntityExpandResult,
} from '/src/selectors.js';
import {
  createEntity,
  deleteEntity,
  entitySetAddEntity,
  updateEntitySetItemMutate,
  updateEntitySetItemNoMutate,
  queryEntities,
  queryEntityExpand,
  updateEntity,
} from '/src/actions/index.js';
import { UpdateStatus } from '/src/components/common/index.jsx';

const entityEditorWrapper = (EditorComponent) => {
  const WrappedComponent = class extends React.Component {
    constructor(props) {
      super(props);

      const { entities } = props;

      const config = {
        model: props.model,
        namespace: new Namespace(props.collection.foreign_id),
        createEntity: this.createEntity.bind(this),
        deleteEntity: this.deleteEntity.bind(this),
        expandEntity: this.expandEntity.bind(this),
        updateEntity: this.updateEntity.bind(this),
        getEntitySuggestions: this.getEntitySuggestions.bind(this),
      };
      this.entityManager = new EntityManager(config);

      if (entities) {
        const processedEntities = entities.map((e) => e.clone());
        this.entityManager.addEntities(processedEntities);
      }
      this.pendingPromises = [];
    }

    componentDidUpdate() {
      const { selectQueryResults } = this.props;

      // if there is an unresolved query promise, check if results have returned and resolve
      if (this.pendingPromises.length) {
        this.pendingPromises = this.pendingPromises.filter(
          ({ query, promiseResolve }) => {
            const results = selectQueryResults(query);
            if (results) {
              promiseResolve(results);
              return false;
            }
            return true;
          }
        );
      }
    }

    getEntitySuggestions(queryText, schema) {
      const { collection, location } = this.props;
      const query = entitySuggestQuery(location, collection, schema, {
        prefix: queryText,
      });

      // throttle entities query request
      clearTimeout(this.entitySuggestTimeout);
      this.entitySuggestTimeout = setTimeout(() => {
        this.props.queryEntities({ query });
      }, 150);

      return new Promise((resolve) => {
        this.pendingPromises.push({ query, promiseResolve: resolve });
      });
    }

    async createEntity(entity, local = true) {
      const { collection, entitySetId, onStatusChange } = this.props;
      onStatusChange && onStatusChange(UpdateStatus.IN_PROGRESS);
      try {
        if (entitySetId && local) {
          await this.props.entitySetAddEntity({
            entity,
            entitySetId,
            sync: true,
          });
        } else {
          await this.props.createEntity({
            entity,
            collection_id: collection.id,
          });
        }
        onStatusChange && onStatusChange(UpdateStatus.SUCCESS);
      } catch {
        onStatusChange && onStatusChange(UpdateStatus.ERROR);
      }
      return null;
    }

    async expandEntity(entityId, properties, limit) {
      const query = entityExpandQuery(entityId, properties, limit);
      this.props.queryEntityExpand({ query });
      return new Promise((resolve) => {
        this.pendingPromises.push({ query, promiseResolve: resolve });
      });
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
      const { entitySetId, mutateOnUpdate, onStatusChange } = this.props;

      onStatusChange && onStatusChange(UpdateStatus.IN_PROGRESS);

      try {
        if (entitySetId) {
          const updateAction = mutateOnUpdate
            ? this.props.updateEntitySetItemMutate
            : this.props.updateEntitySetItemNoMutate;
          await updateAction({
            entityId,
            entitySetId,
            judgement: 'no_judgement',
          });
        } else {
          await this.props.deleteEntity(entityId);
        }
        onStatusChange && onStatusChange(UpdateStatus.SUCCESS);
      } catch {
        onStatusChange && onStatusChange(UpdateStatus.ERROR);
      }
    }

    render() {
      // return editor component with entityManager
      const { setRef } = this.props;
      return (
        <EditorComponent
          ref={setRef}
          entityManager={this.entityManager}
          {...this.props}
        />
      );
    }
  };
  return compose(
    withRouter,
    connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })
  )(WrappedComponent);
};

const mapStateToProps = (state, ownProps) => {
  const { entitySetId } = ownProps.params;

  return {
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
  };
};

const mapDispatchToProps = {
  createEntity,
  deleteEntity,
  entitySetAddEntity,
  updateEntitySetItemMutate,
  updateEntitySetItemNoMutate,
  queryEntities,
  queryEntityExpand,
  updateEntity,
};

export default entityEditorWrapper;
