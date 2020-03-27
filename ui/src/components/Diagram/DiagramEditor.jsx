import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { VisGraph, EntityManager, GraphConfig, GraphLayout, Viewport } from '@alephdata/vislib';
import { createEntity, deleteEntity, queryEntities, updateDiagram, updateEntity } from 'src/actions';
import { processApiEntity } from 'src/components/Diagram/util';
import { queryEntitySuggest } from 'src/queries';
import { selectLocale, selectModel, selectEntitiesResult } from 'src/selectors';
import updateStates from './diagramUpdateStates';

import './DiagramEditor.scss';

const fileDownload = require('js-file-download');

const config = new GraphConfig({ editorTheme: 'light', toolbarPosition: 'left' });

class DiagramEditor extends React.Component {
  constructor(props) {
    super(props);

    this.entityManager = new EntityManager({
      model: props.model,
      createEntity: this.createEntity.bind(this),
      updateEntity: this.updateEntity.bind(this),
      deleteEntity: this.deleteEntity.bind(this),
      getEntitySuggestions: this.getEntitySuggestions.bind(this),
    });

    let initialLayout;

    if (props.diagram?.entities && props.diagram?.layout) {
      const { layout, entities } = props.diagram;

      const processedEntities = entities.map(processApiEntity);

      initialLayout = GraphLayout.fromJSON(
        config,
        this.entityManager,
        { ...layout, entities: processedEntities, selection: [] },
      );
    } else {
      initialLayout = new GraphLayout(config, this.entityManager);
    }

    this.state = {
      layout: initialLayout,
      viewport: new Viewport(config),
    };

    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
  }

  componentDidMount() {
    const { layout } = this.state;

    // set viewport to fit all vertices present in layout
    const initialBounds = layout.getVisibleVertexRect();
    this.setState(({ viewport }) => ({
      viewport: viewport.fitToRect(initialBounds),
    }));
  }

  componentDidUpdate(prevProps) {
    const { selectQueryResults } = this.props;
    if (this.props.downloadTriggered && !prevProps.downloadTriggered) {
      this.downloadDiagram();
    }

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
    const { diagram, location, selectQueryResults } = this.props;
    const query = queryEntitySuggest(location, diagram.collection, schema, queryText);

    const results = selectQueryResults(query);
    if (results) {
      this.entitySuggestPromise = null;
      return results;
    }

    this.props.queryEntities({ query });

    return new Promise((resolve) => {
      this.entitySuggestPromise = { query, promiseResolve: resolve };
    });
  }

  async createEntity({ schema, properties }) {
    const { diagram, onStatusChange } = this.props;
    onStatusChange(updateStates.IN_PROGRESS);

    try {
      const entityData = await this.props.createEntity({
        schema: schema.name,
        properties: properties || {},
        collection: diagram.collection,
      });
      onStatusChange(updateStates.SUCCESS);

      return processApiEntity(entityData);
    } catch {
      onStatusChange(updateStates.ERROR);
    }
    return null;
  }

  async updateEntity(entity) {
    const { diagram, onStatusChange } = this.props;
    onStatusChange(updateStates.IN_PROGRESS);

    try {
      await this.props.updateEntity({ entity, collectionId: diagram.collection.id });
      onStatusChange(updateStates.SUCCESS);
    } catch {
      onStatusChange(updateStates.ERROR);
    }
  }

  async deleteEntity(entityId) {
    const { onStatusChange } = this.props;

    onStatusChange(updateStates.IN_PROGRESS);
    try {
      await this.props.deleteEntity(entityId);
      onStatusChange(updateStates.SUCCESS);
    } catch {
      onStatusChange(updateStates.ERROR);
    }
  }

  updateLayout(layout, options) {
    const { diagram, onStatusChange } = this.props;
    this.setState({ layout });

    if (options?.propagate) {
      onStatusChange(updateStates.IN_PROGRESS);
      const { entities, selection, ...layoutData } = layout.toJSON();

      const updatedDiagram = {
        ...diagram,
        layout: layoutData,
        entities: entities ? entities.map(entity => entity.id) : [],
      };

      this.props.updateDiagram(updatedDiagram.id, updatedDiagram)
        .then(() => {
          onStatusChange(updateStates.SUCCESS);
        })
        .catch(() => {
          onStatusChange(updateStates.ERROR);
        });
    }
  }

  updateViewport(viewport) {
    this.setState({ viewport });
  }

  exportSvg(data) {
    const { diagram } = this.props;
    fileDownload(data, `${diagram.label}.svg`);
  }

  downloadDiagram() {
    const { diagram, onDownloadComplete } = this.props;
    const { layout, viewport } = this.state;

    const graphData = JSON.stringify({
      layout: layout.toJSON(),
      viewport: viewport.toJSON(),
    });
    fileDownload(graphData, `${diagram.label}.vis`);
    onDownloadComplete();
  }

  render() {
    const { diagram, filterText, locale } = this.props;
    const { layout, viewport } = this.state;

    return (
      <div className="DiagramEditor">
        <VisGraph
          config={config}
          entityManager={this.entityManager}
          layout={layout}
          viewport={viewport}
          updateLayout={this.updateLayout}
          updateViewport={this.updateViewport}
          exportSvg={this.exportSvg}
          externalFilterText={filterText}
          writeable={diagram.writeable}
          locale={locale}
        />
      </div>
    );
  }
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
  deleteEntity,
  queryEntities,
  updateDiagram,
  updateEntity,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(DiagramEditor);
