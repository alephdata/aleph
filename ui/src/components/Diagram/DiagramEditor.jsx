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

    let viewport = new Viewport(config)
    const writeable = props.diagram?.writeable
    let initialLayout;

    if (props.diagram?.layout) {
      const { layout, entities } = props.diagram;
      initialLayout = GraphLayout.fromJSON(config, this.entityManager, { ...layout, entities, selection: [] });
      const initialBounds = initialLayout.getVisibleVertexRect();
      viewport = viewport.fitToRect(initialBounds);
    } else {
      initialLayout = new GraphLayout(config, this.entityManager);
    }

    this.state = {
      layout: initialLayout,
      viewport,
      writeable,
    };

    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
    // this.dispatchLayoutUpdate = this.dispatchLayoutUpdate.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.downloadTriggered && !prevProps.downloadTriggered) {
      this.downloadDiagram();
    }
  }

  componentWillUnmount() {
    if (!this.layoutToSend) {
      // this.dispatchLayoutUpdate();
    }
  }

  updateLayout(updatedLayout, historyModified = false) {
    const { diagram, onStatusChange } = this.props;
    this.setState({ layout: updatedLayout });

    console.log(updatedLayout);

    if (historyModified) {

      onStatusChange(updateStates.IN_PROGRESS);

      const updatedDiagram = diagram;

      // TODO - FIX THIS IN VISLIB, make sure that groupings key is always populated
      const { entities, selection, ...updatedDiagramData } = updatedLayout.toJSON();
      console.log('updatedDiagramData is', updatedDiagramData);
      console.log('diagram is', diagram);

      updatedDiagramData.groupings = updatedDiagramData.groupings || [];
      console.log('updatedDiagramData is after', updatedDiagramData);

      updatedDiagram.layout = updatedDiagramData;
      updatedDiagram.entities = entities ? entities.map(entity => entity.id) : [];

      console.log('updatedDiagram is', updatedDiagram);

      this.props.updateDiagram(diagram.id, updatedDiagram)
        .then(() => {
          console.log('finished');
          this.layoutToSend = null;
          onStatusChange(updateStates.SUCCESS);
        })
        .catch(
          this.layoutToSend = null;
          onStatusChange(updateStates.ERROR);
        });

      // if (!this.layoutToSend) {
      //   console.log('setting timeout');
      //   setTimeout(this.dispatchLayoutUpdate, 3000);
      // }
      //
      // this.layoutToSend = layout;
    }
  }

  // dispatchLayoutUpdate() {
  //   const { diagram, onStatusChange } = this.props;
  //
  //   console.log('dispatching', diagram);
  //   onStatusChange(updateStates.IN_PROGRESS);
  //
  //   const updatedDiagram = diagram;
  //   delete this.layoutToSend.entities;
  //   updatedDiagram.data = { layout: this.layoutToSend };
  //   this.props.updateDiagram(diagram.id, updatedDiagram)
  //     .then(() => {
  //       console.log('finished');
  //       this.layoutToSend = null;
  //       onStatusChange(updateStates.SUCCESS);
  //     })
  //     .catch((e) => {
  //       console.log('error', e);
  //       this.layoutToSend = null;
  //       onStatusChange(updateStates.ERROR);
  //     });
  // }

  async createEntity({ schema, properties }) {
    const { diagram, onStatusChange } = this.props;
    console.log('CALLING CREATE ENTITY', schema, properties);
    onStatusChange(updateStates.IN_PROGRESS);
    try {
      const entityData = await this.props.createEntity({
        schema: schema.name,
        properties,
        collection: diagram.collection,
      });
      onStatusChange(updateStates.SUCCESS);

      return entityData;
    } catch(e) {
      console.log('error is', e);
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

  async undeleteEntity(entityId) {
    const { onStatusChange } = this.props;
    onStatusChange(updateStates.IN_PROGRESS);

    console.log('CALLING UNDELETE ENTITY', entityId);
    try {
      await this.props.undeleteEntity(entityId);
      onStatusChange(updateStates.SUCCESS);
    } catch {
      onStatusChange(updateStates.ERROR);
    }
  }

  async deleteEntity(entityId) {
    const { onStatusChange } = this.props;

    console.log('CALLING DELETE ENTITY', entityId);
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
