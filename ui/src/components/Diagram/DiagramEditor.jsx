import React from 'react';
import { connect } from 'react-redux';
import { Intent } from '@blueprintjs/core';
import { VisGraph, EntityManager, GraphConfig, GraphLayout, Viewport } from '@alephdata/vislib';
import { updateDiagram } from 'src/actions';

import './DiagramEditor.scss';

const fileDownload = require('js-file-download');

const config = new GraphConfig({ editorTheme: 'light', toolbarPosition: 'left', writeable: true });
const entityManager = new EntityManager();

class DiagramEditor extends React.Component {
  constructor(props) {
    super(props);
    let storedLayout;

    if (props.diagram?.data?.layout?.entities) {
      storedLayout = props.diagram.data.layout;
    }

    this.state = {
      layout: storedLayout
        ? GraphLayout.fromJSON(config, entityManager, storedLayout)
        : new GraphLayout(config, entityManager),
      viewport: new Viewport(config),
    };

    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
    this.dispatchLayoutUpdate = this.dispatchLayoutUpdate.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.downloadTriggered && !prevProps.downloadTriggered) {
      this.downloadDiagram();
    }
  }

  componentWillUnmount() {
    if (!this.layoutToSend) {
      this.dispatchLayoutUpdate();
    }
  }

  updateLayout(layout, historyModified = false) {
    const { onStatusChange } = this.props;
    this.setState({ layout });

    if (historyModified) {
      onStatusChange();
      console.log('history modified');
      if (!this.layoutToSend) {
        console.log('setting timeout');
        setTimeout(this.dispatchLayoutUpdate, 3000);
      }

      this.layoutToSend = layout;
    }
  }

  dispatchLayoutUpdate() {
    const { diagram, onStatusChange } = this.props;

    console.log('dispatching', diagram);
    onStatusChange({ text: 'Saving...', intent: Intent.PRIMARY });

    const updatedDiagram = diagram;
    updatedDiagram.data = { layout: this.layoutToSend };
    this.props.updateDiagram(diagram.id, updatedDiagram)
      .then(() => {
        console.log('finished');
        this.layoutToSend = null;
        onStatusChange({ text: 'Saved', intent: Intent.SUCCESS });
      })
      .catch(() => {
        console.log('error');
        this.layoutToSend = null;
        onStatusChange({ text: 'Error saving', intent: Intent.DANGER });
      });
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

    return (
      <div className="DiagramEditor">
        <VisGraph
          config={config}
          entityManager={entityManager}
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

export default connect(mapStateToProps, { updateDiagram })(DiagramEditor);
