import React from 'react';
import { connect } from 'react-redux';

import Preview from 'src/components/Preview/Preview';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityViews from 'src/components/Entity/EntityViews';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import { selectEntity, selectEntityView, selectEntityReferences } from 'src/selectors';


const mapStateToProps = (state, ownProps) => {
  const { previewId, previewMode } = ownProps;
  const entity = selectEntity(state, previewId);
  return {
    entity,
    references: selectEntityReferences(state, previewId),
    previewMode: selectEntityView(state, previewId, previewMode, true),
  };
};


export class PreviewEntity extends React.Component {
  renderContext() {
    const { entity, references, previewMode } = this.props;
    if (entity.isError) {
      return <ErrorSection error={entity.error} />;
    }
    if (entity.shouldLoad || entity.isLoading || references.shouldLoad || references.isLoading) {
      return <SectionLoading />;
    }
    return (
      <React.Fragment>
        <EntityToolbar entity={entity} isPreview />
        <EntityHeading entity={entity} isPreview />
        <EntityViews entity={entity} activeMode={previewMode} isPreview />
      </React.Fragment>
    );
  }

  render() {
    const { previewId } = this.props;
    return (
      <EntityContextLoader entityId={previewId}>
        <Preview maximised>
          <DualPane.InfoPane className="with-heading">
            {this.renderContext()}
          </DualPane.InfoPane>
        </Preview>
      </EntityContextLoader>
    );
  }
}

export default connect(mapStateToProps)(PreviewEntity);
