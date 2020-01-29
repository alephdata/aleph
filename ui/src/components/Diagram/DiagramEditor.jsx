import React from 'react';
import { connect } from 'react-redux';
import { VisGraph, EntityManager, GraphConfig, GraphLayout, Viewport } from '@alephdata/vislib';
import { createEntity, deleteEntity, undeleteEntity, updateDiagram, updateEntity } from 'src/actions';
import updateStates from './diagramUpdateStates';
import './DiagramEditor.scss';

const fileDownload = require('js-file-download');

const config = new GraphConfig({ editorTheme: 'light', toolbarPosition: 'left' });

class DiagramEditor extends React.Component {
  constructor(props) {
    super(props);

    this.entityManager = new EntityManager({
      createEntity: this.createEntity.bind(this),
      updateEntity: this.updateEntity.bind(this),
      deleteEntity: this.deleteEntity.bind(this),
      undeleteEntity: this.undeleteEntity.bind(this),
    });

    let initialLayout;

    if (props.diagram?.layout) {
      const { layout, entities } = props.diagram;
      initialLayout = GraphLayout.fromJSON(
        config,
        this.entityManager,
        { ...layout, entities, selection: [] },
      );
    } else {
      initialLayout = new GraphLayout(config, this.entityManager);
    }

    this.state = {
      layout: initialLayout,
      viewport: new Viewport(config),
      writeable: props.diagram?.writeable,
    };

    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
  }

  componentDidMount() {
    const { layout } = this.state;
    const initialBounds = layout.getVisibleVertexRect();
    this.setState(({ viewport }) => ({
      viewport: viewport.fitToRect(initialBounds),
    }));
  }

  componentDidUpdate(prevProps) {
    if (this.props.downloadTriggered && !prevProps.downloadTriggered) {
      this.downloadDiagram();
    }
  }

  updateLayout(layout, propagateUpdate = false) {
    const { diagram, onStatusChange } = this.props;
    this.setState({ layout });

    if (propagateUpdate) {
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

      return entityData;
    } catch {
      onStatusChange(updateStates.ERROR);
    }
    return false;
  }

  async updateEntity(entity) {
    const { onStatusChange } = this.props;
    onStatusChange(updateStates.IN_PROGRESS);

    try {
      await this.props.updateEntity(entity);
      onStatusChange(updateStates.SUCCESS);
    } catch {
      onStatusChange(updateStates.ERROR);
    }
    return false;
  }

  async undeleteEntity(entity) {
    const { onStatusChange } = this.props;
    onStatusChange(updateStates.IN_PROGRESS);

    try {
      await this.props.undeleteEntity(entity);
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
    const { filterText } = this.props;
    const { layout, viewport, writeable } = this.state;

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
          writeable={writeable}
        />
      </div>
    );
  }
}

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {
  createEntity,
  deleteEntity,
  undeleteEntity,
  updateDiagram,
  updateEntity,
})(DiagramEditor);
