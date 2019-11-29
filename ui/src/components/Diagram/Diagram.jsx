import React from 'react';
import { VisGraph, GraphConfig, GraphLayout, Viewport } from '@alephdata/vislib';

import './Diagram.scss';

const config = new GraphConfig();

class Diagram extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      layout: new GraphLayout(config),
      viewport: new Viewport(config),
    };

    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
  }

  updateLayout(layout, historyModified = false) {
    this.setState({ layout });
    console.log('updating', historyModified);
    // if (historyModified) {
    //   //send update
    // }
  }

  updateViewport(viewport) {
    this.setState({ viewport });
  }

  exportSvg(data) {
    console.log('exporting', data, this);
  }

  render() {
    const { layout, viewport } = this.state;
    return (
      <div className="Diagram">
        <VisGraph
          config={config}
          layout={layout}
          viewport={viewport}
          updateLayout={this.updateLayout}
          updateViewport={this.updateViewport}
          exportSvg={this.exportSvg}
          writeable
        />
      </div>
    );
  }
}

export default Diagram;
