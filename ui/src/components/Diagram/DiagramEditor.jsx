// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { exportSvg, NetworkDiagram, GraphConfig, GraphLayout, Viewport } from '@alephdata/react-ftm';
import entityEditorWrapper from 'components/Entity/entityEditorWrapper';
import { updateEntitySet } from 'actions';
import { UpdateStatus } from 'components/common';

import './DiagramEditor.scss';

const fileDownload = require('js-file-download');

const config = new GraphConfig({ editorTheme: 'light', toolbarPosition: 'left' });

class DiagramEditor extends React.Component {
  constructor(props) {
    super(props);
    const { diagram, entityManager } = props;
    let initialLayout;

    if (diagram) {
      const layoutData = { vertices: [], edges: [], selection: [] };

      initialLayout = GraphLayout.fromJSON(
        config,
        {...layoutData, ...diagram.layout}
      );
      initialLayout.layout(entityManager.getEntities());
    } else {
      initialLayout = new GraphLayout(config);
    }

    this.state = {
      layout: initialLayout,
      viewport: new Viewport(config),
    };

    this.updateLayout = this.updateLayout.bind(this);
    this.updateViewport = this.updateViewport.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
    this.svgRef = React.createRef();
  }

  componentDidMount() {
    const { layout } = this.state;

    // set viewport to fit all vertices present in layout
    const initialBounds = layout.getVisibleVertexRect();
    this.setState(({ viewport }) => ({
      viewport: viewport.fitToRect(initialBounds),
    }));
  }

  updateLayout(layout, options) {
    const { diagram, onStatusChange } = this.props;
    this.setState({ layout });

    if (options?.propagate) {
      onStatusChange(UpdateStatus.IN_PROGRESS);
      const { selection, ...layoutData } = layout.toJSON();

      const updatedDiagram = {
        ...diagram,
        layout: layoutData,
      };

      this.props.updateEntitySet(updatedDiagram.id, updatedDiagram)
        .then(() => {
          onStatusChange(UpdateStatus.SUCCESS);
        })
        .catch(() => {
          onStatusChange(UpdateStatus.ERROR);
        });
    }
  }

  updateViewport(viewport) {
    this.setState({ viewport });
  }

  exportSvg() {
    const { diagram } = this.props;
    const { layout, viewport } = this.state;
    const data = exportSvg(layout, viewport, this.svgRef.current);

    fileDownload(data, `${diagram.label}.svg`);
  }

  render() {
    const { diagram, entityManager, filterText, locale } = this.props;
    const { layout, viewport } = this.state;

    return (
      <div className="DiagramEditor">
        <NetworkDiagram
          config={config}
          entityManager={entityManager}
          layout={layout}
          viewport={viewport}
          updateLayout={this.updateLayout}
          updateViewport={this.updateViewport}
          externalFilterText={filterText}
          writeable={diagram.writeable}
          locale={locale}
          svgRef={this.svgRef}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  updateEntitySet,
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true }),
  entityEditorWrapper,
)(DiagramEditor);
