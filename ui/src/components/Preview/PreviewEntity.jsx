import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchEntity } from 'src/actions';
import { selectEntity } from 'src/selectors';
import Preview from 'src/components/Preview/Preview';
import EntityInfoMode from 'src/components/Entity/EntityInfoMode';
import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import EntityViewsMenu from "src/components/ViewsMenu/EntityViewsMenu";

class PreviewEntity extends React.Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { entity, previewId } = this.props;
    if (entity.shouldLoad) {
      this.props.fetchEntity({ id: previewId });
    }
  }

  render() {
    const { entity, previewMode = 'view' } = this.props;
    let mode = null, maximised = false;
    if (entity.isError) {
      return <ErrorSection error={entity.error} />
    } else if (entity.id === undefined) {
      return <SectionLoading/>;
    } else if (previewMode === 'info') {
      mode = <EntityInfoMode entity={entity} />;
    } else if (previewMode === 'tags') {
      mode = <EntityTagsMode entity={entity} />;
    } else if (previewMode === 'similar') {
      mode = <EntitySimilarMode entity={entity} />;
      maximised = true;
    } else {
      mode = <EntityInfoMode entity={entity} />;
      maximised = true;
    }
    return (
      <Preview maximised={maximised}>
        <EntityViewsMenu entity={entity}
                         activeMode={previewMode}
                         isPreview={true} />
        <DualPane.InfoPane className="with-heading">
          <EntityToolbar entity={entity} isPreview={true} />
          {mode}
        </DualPane.InfoPane>
      </Preview>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return { entity: selectEntity(state, ownProps.previewId) };
};

PreviewEntity = connect(mapStateToProps, { fetchEntity })(PreviewEntity);
PreviewEntity = withRouter(PreviewEntity);
export default PreviewEntity;