import React from 'react';
import { connect } from 'react-redux';

import { selectEntity, selectEntityView, selectEntityReferences } from 'src/selectors';
import Preview from 'src/components/Preview/Preview';
import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import EntityReferencesMode from 'src/components/Entity/EntityReferencesMode';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import EntityViewsMenu from "src/components/ViewsMenu/EntityViewsMenu";
import { selectEntitiesResult, selectEntityTags } from "../../selectors";
import { queryEntitySimilar } from "../../queries";
import { withRouter } from "react-router";


class PreviewEntity extends React.Component {
  render() {
    const { previewId } = this.props;
    return (
      <EntityContextLoader entityId={previewId}>
        {this.renderContext()}
      </EntityContextLoader>
    );
  }

  renderContext() {
    const { entity, references, previewMode, similar, tags } = this.props;
    let mode = null, maximised = false;
    if (entity.isError) {
      return <ErrorSection error={entity.error} />
    } else if (entity.id === undefined || references.isLoading) {
      return <SectionLoading/>;
    } else if (previewMode === 'info') {
      mode = <EntityInfoMode entity={entity} />;
    } else if (previewMode === 'tags') {
      mode = <EntityTagsMode entity={entity} />;
      maximised = true;
    } else if (previewMode === 'similar') {
      mode = <EntitySimilarMode entity={entity} />;
      maximised = true;
    } else {
      mode = <EntityReferencesMode entity={entity} mode={previewMode} />;
      maximised = true;
    }
    return (
      <Preview maximised={maximised}>
        <EntityViewsMenu entity={entity}
                          activeMode={previewMode}
                          isPreview={true}
                          similar={similar}
                          tags={tags}/>
        <DualPane.InfoPane className="with-heading">
          <EntityToolbar entity={entity} isPreview={true} />
          {mode}
        </DualPane.InfoPane>
      </Preview>
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