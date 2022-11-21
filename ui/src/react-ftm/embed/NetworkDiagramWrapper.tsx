import React from 'react';
import { IWrappedElementProps } from 'react-ftm/embed/common';
import {
  GraphConfig,
  GraphLayout,
  Viewport,
  NetworkDiagram,
} from 'react-ftm/components/NetworkDiagram';

const config = new GraphConfig({
  editorTheme: 'light',
  toolbarPosition: 'top',
});

interface INetworkDiagramState {
  layout: GraphLayout;
  locale?: string;
  viewport: Viewport;
}

export default class NetworkDiagramWrapper extends React.Component<
  IWrappedElementProps,
  INetworkDiagramState
> {
  constructor(props: IWrappedElementProps) {
    super(props);
    const { layoutData } = props;

    this.state = {
      layout: layoutData?.layout
        ? GraphLayout.fromJSON(config, layoutData.layout)
        : new GraphLayout(config),
      viewport: layoutData?.viewport
        ? Viewport.fromJSON(config, layoutData.viewport)
        : new Viewport(config),
    };

    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
  }

  componentDidMount() {
    const { layout } = this.state;

    // set viewport to fit all vertices present in layout
    const initialBounds = layout.getVisibleVertexRect();
    this.setState(({ viewport }) => ({
      viewport: viewport.fitToRect(initialBounds),
    }));
  }

  updateLayout(layout: GraphLayout, historyModified = false) {
    this.setState({ layout: layout });

    if (historyModified) {
      this.propagateUpdate({ layout });
    }
  }

  updateViewport(viewport: Viewport) {
    this.setState({ viewport: viewport });
    this.propagateUpdate({ viewport });
  }

  propagateUpdate({
    layout,
    viewport,
  }: {
    layout?: GraphLayout;
    viewport?: Viewport;
  }) {
    const graphData = {
      layout: layout ? layout.toJSON() : this.state.layout.toJSON(),
      viewport: viewport ? viewport.toJSON() : this.state.viewport.toJSON(),
    };
    this.props.onUpdate(graphData);
  }

  render() {
    const { entityManager, writeable } = this.props;
    const { layout, viewport } = this.state;

    return (
      <NetworkDiagram
        config={config}
        entityManager={entityManager}
        layout={layout}
        viewport={viewport}
        updateLayout={this.updateLayout}
        updateViewport={this.updateViewport}
        locale="en"
        writeable={writeable}
      />
    );
  }
}
