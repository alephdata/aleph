import React from 'react';
import { connect } from 'react-redux';
import { Intent } from '@blueprintjs/core';
import { VisGraph, GraphConfig, GraphLayout, Viewport } from '@alephdata/vislib';
import { updateDiagram } from 'src/actions';

import './DiagramEditor.scss';

const config = new GraphConfig({ toolbarPosition: 'left', toolbarColor: '#2e363d' });

class DiagramEditor extends React.Component {
  constructor(props) {
    super(props);
    let storedLayout;

    if (props?.diagram?.data?.layout?.entities) {
      storedLayout = props.diagram.data.layout;
    }

    this.state = {
      layout: storedLayout
        ? GraphLayout.fromJSON(config, storedLayout)
        : new GraphLayout(config),
      viewport: new Viewport(config),
    };

    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
  }

  updateLayout(layout, historyModified = false) {
    const { diagram, onStatusChange } = this.props;
    this.setState({ layout });
    console.log(historyModified);
    if (historyModified) {
      onStatusChange({ text: 'Saving...', intent: Intent.PRIMARY });
      const updatedDiagram = diagram;
      updatedDiagram.data = { layout };
      this.props.updateDiagram(diagram.id, updatedDiagram)
        .then(() => {
          onStatusChange({ text: 'Saved', intent: Intent.SUCCESS });
        })
        .catch((e) => {
          console.log(e);
          onStatusChange({ text: 'Error saving', intent: Intent.DANGER });
        });
    }
  }

  updateViewport(viewport) {
    this.setState({ viewport });
  }

  exportSvg(data) {
    console.log('exporting', data, this);
  }

  render() {
    const { filterText } = this.props;
    const { layout, viewport } = this.state;

    return (
      <div className="DiagramEditor">
        <VisGraph
          config={config}
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
