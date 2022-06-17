// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Namespace } from '@alephdata/followthemoney';
import { EntityManager } from '@alephdata/react-ftm';

import withRouter from 'app/withRouter'
import { entityExpandQuery, entitySuggestQuery } from 'queries';
import { selectLocale, selectModel, selectEntitiesResult, selectEntityExpandResult } from 'selectors';
import {
  createEntity,
  deleteEntity,
  entitySetAddEntity,
  updateEntitySetItemMutate,
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
          const processedEntities = entities.map(e => e.clone());
          this.entityManager.addEntities(processedEntities);
        }
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
        const query = entitySuggestQuery(location, collection, schema, { prefix: queryText });

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
            await this.props.entitySetAddEntity({ entity, entitySetId, sync: true });
          } else {
            await this.props.createEntity({ entity, collection_id: collection.id });
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
            const updateAction = mutateOnUpdate ? this.props.updateEntitySetItemMutate : this.props.updateEntitySetItemNoMutate;
            await updateAction({
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
    }
  );
  return compose(
    withRouter,
    connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true }),
  )(WrappedComponent);
}

const mapStateToProps = (state, ownProps) => {
  const { entitySetId } = ownProps.params;

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
  updateEntitySetItemMutate,
  updateEntitySetItemNoMutate,
  queryEntities,
  queryEntityExpand,
  updateEntity,
};

export default entityEditorWrapper;
