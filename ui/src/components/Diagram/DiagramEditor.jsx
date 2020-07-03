import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { VisGraph, GraphConfig, GraphLayout, Viewport } from '@alephdata/react-ftm';
import { processApiEntity } from 'src/components/EntitySet/util';
import entityEditorWrapper from 'src/components/Entity/entityEditorWrapper';
import { updateEntitySet } from 'src/actions';
import updateStates from 'src/util/updateStates';

import './DiagramEditor.scss';

const fileDownload = require('js-file-download');

const config = new GraphConfig({ editorTheme: 'light', toolbarPosition: 'left' });

class DiagramEditor extends React.Component {
  constructor(props) {
    super(props);
    const { diagram } = props;
    let initialLayout;

    if (diagram) {
      let layoutData = { vertices: [], edges: [], entities: [], selection: [] };
      if (diagram.entities) {
        layoutData.entities = diagram.entities.map(processApiEntity);
      }
      if (diagram.layout) {
        layoutData = {...layoutData, ...diagram.layout};
      }

      initialLayout = GraphLayout.fromJSON(
        config,
        props.entityManager,
        layoutData
      );
    } else {
      initialLayout = new GraphLayout(config, props.entityManager);
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
    if (this.props.downloadTriggered && !prevProps.downloadTriggered) {
      this.downloadDiagram();
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

      this.props.updateEntitySet(updatedDiagram.id, updatedDiagram)
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
    const { diagram, entityManager, filterText, locale } = this.props;
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
          writeable={diagram.writeable}
          locale={locale}
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
  connect(mapStateToProps, mapDispatchToProps),
  entityEditorWrapper
)(DiagramEditor);
