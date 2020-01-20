import React from 'react';
import { connect } from 'react-redux';
import { Intent } from '@blueprintjs/core';
import { VisGraph, EntityManager, GraphConfig, GraphLayout, Viewport } from '@alephdata/vislib';
import { createEntity, deleteEntity, updateDiagram, updateEntity } from 'src/actions';

import './DiagramEditor.scss';

const fileDownload = require('js-file-download');

const config = new GraphConfig({ editorTheme: 'light', toolbarPosition: 'left', writeable: true });

class DiagramEditor extends React.Component {
  constructor(props) {
    super(props);

    this.entityManager = new EntityManager({
      createEntity: this.createEntity.bind(this),
      updateEntity: this.updateEntity.bind(this),
      deleteEntity: this.deleteEntity.bind(this),
    });

    const viewport = new Viewport(config)
    let initialLayout;

    if (props.diagram?.layout) {
      const { layout, entities } = props.diagram;
      console.log({ ...layout, entities });
      initialLayout = GraphLayout.fromJSON(config, this.entityManager, { ...layout, entities, selection: [] });
      // const initialBounds = initialLayout.getVisibleVertexRect();
      // viewport.fitToRect(initialBounds);
    } else {
      initialLayout = new GraphLayout(config, this.entityManager);
    }

    console.log('stored layout is', props.diagram, initialLayout);

    this.state = {
      layout: initialLayout,
      viewport,
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
      console.log('history modified');

      onStatusChange({ text: 'Saving...', intent: Intent.PRIMARY });

      const updatedDiagram = diagram;

      // TODO - FIX THIS IN VISLIB, make sure that groupings key is always populated
      console.log('updatedLayout is', updatedLayout);
      const { entities, selection, ...updatedDiagramData } = updatedLayout.toJSON();
      console.log('updatedDiagramData is', updatedDiagramData);
      console.log('diagram is', diagram);

      updatedDiagramData.groupings = [];
      console.log('updatedDiagramData is after', updatedDiagramData);

      updatedDiagram.layout = updatedDiagramData;
      updatedDiagram.entities = entities ? entities.map(entity => entity.id) : [];

      console.log('updatedDiagram is', updatedDiagram);

      this.props.updateDiagram(diagram.id, updatedDiagram)
        .then(() => {
          console.log('finished');
          this.layoutToSend = null;
          onStatusChange({ text: 'Saved', intent: Intent.SUCCESS });
        })
        .catch((e) => {
          console.log('error', e);
          this.layoutToSend = null;
          onStatusChange({ text: 'Error saving', intent: Intent.DANGER });
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
  //   onStatusChange({ text: 'Saving...', intent: Intent.PRIMARY });
  //
  //   const updatedDiagram = diagram;
  //   delete this.layoutToSend.entities;
  //   updatedDiagram.data = { layout: this.layoutToSend };
  //   this.props.updateDiagram(diagram.id, updatedDiagram)
  //     .then(() => {
  //       console.log('finished');
  //       this.layoutToSend = null;
  //       onStatusChange({ text: 'Saved', intent: Intent.SUCCESS });
  //     })
  //     .catch((e) => {
  //       console.log('error', e);
  //       this.layoutToSend = null;
  //       onStatusChange({ text: 'Error saving', intent: Intent.DANGER });
  //     });
  // }

  async createEntity({ schema, properties }) {
    const { diagram, onStatusChange } = this.props;
    console.log('CALLING CREATE ENTITY', schema, properties);
    try {
      const entityData = await this.props.createEntity({
        schema: schema.name,
        properties,
        collection: diagram.collection,
      });
      return entityData;
    } catch {
      onStatusChange({ text: 'Error saving', intent: Intent.DANGER });
    }
    return false;
  }

  updateEntity(entity) {
    const { onStatusChange } = this.props;
    try {
      this.props.updateEntity(entity);
    } catch {
      onStatusChange({ text: 'Error saving', intent: Intent.DANGER });
    }
    return false;
  }

  deleteEntity(entityId) {
    const { onStatusChange } = this.props;

    console.log('CALLING DELETE ENTITY', entityId);
    try {
      this.props.deleteEntity(entityId);
    } catch {
      onStatusChange({ text: 'Error saving', intent: Intent.DANGER });
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
    const { layout, viewport } = this.state;

    console.log(filterText);

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
          writeable
        />
      </div>
    );
  }
}

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {
  createEntity,
  deleteEntity,
  updateDiagram,
  updateEntity,
})(DiagramEditor);
