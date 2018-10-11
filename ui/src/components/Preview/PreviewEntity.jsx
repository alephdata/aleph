import React from 'react';
import { connect } from 'react-redux';

import { selectEntity, selectEntityView, selectEntityReferences } from 'src/selectors';
import Preview from 'src/components/Preview/Preview';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import EntityReferencesMode from 'src/components/Entity/EntityReferencesMode';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import { DualPane, SectionLoading, ErrorSection, Schema, Entity } from 'src/components/common';
import EntityViewsMenu from "src/components/ViewsMenu/EntityViewsMenu";
import { selectEntitiesResult, selectEntityTags } from "src/selectors";
import { queryEntitySimilar } from "src/queries";
import { withRouter } from "react-router";


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
    const isThing = entity && entity.schemata && entity.schemata.indexOf('Thing') !== -1;
    let mode = null, maximised = true;
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
        <EntityViewsMenu entity={entity}
                         activeMode={previewMode}
                         isPreview={true}
                         similar={similar}
                         tags={tags} />
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
    previewMode: selectEntityView(state, previewId, previewMode, true),
    similar: selectEntitiesResult(state, queryEntitySimilar(location, entity.id)),
    tags: selectEntityTags(state, entity.id)}
  };

PreviewEntity = connect(mapStateToProps, {})(PreviewEntity);
PreviewEntity = withRouter(PreviewEntity);
export default PreviewEntity;