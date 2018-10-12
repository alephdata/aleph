import React from 'react';
import { withRouter } from "react-router";
import { connect } from 'react-redux';

import Preview from 'src/components/Preview/Preview';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityViews from 'src/components/Entity/EntityViews';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import { selectEntity, selectEntityView, selectEntityReferences } from 'src/selectors';
import { queryEntitySimilar } from "src/queries";


class PreviewEntity extends React.Component {
  render() {
    const { previewId } = this.props;
    return (
      <EntityContextLoader entityId={previewId}>
        <Preview maximised={true}>
          <DualPane.InfoPane className="with-heading">
            {this.renderContext()}
          </DualPane.InfoPane>
        </Preview>
      </EntityContextLoader>
    );
  }

  renderContext() {
    const { entity, references, previewMode, similar, tags } = this.props;
    if (entity.isError) {
      return <ErrorSection error={entity.error} />
    }
    if (entity.shouldLoad || entity.isLoading || references.shouldLoad || references.isLoading) {
      return <SectionLoading/>;
    }
    return (
      <React.Fragment>
        <EntityToolbar entity={entity} isPreview={true} />
        <EntityHeading entity={entity} isPreview={true} />
        <EntityViews entity={entity}
                     activeMode={previewMode}
                     isPreview={true} />
      </React.Fragment>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { previewId, previewMode, location } = ownProps;
  const entity = selectEntity(state, previewId);
  return {
    entity,
    references: selectEntityReferences(state, previewId),
    previewMode: selectEntityView(state, previewId, previewMode, true)
  };
};

PreviewEntity = connect(mapStateToProps, {})(PreviewEntity);
PreviewEntity = withRouter(PreviewEntity);
export default PreviewEntity;