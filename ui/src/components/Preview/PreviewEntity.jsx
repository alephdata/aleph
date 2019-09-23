import React from 'react';
import { connect } from 'react-redux';

import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityViews from 'src/components/Entity/EntityViews';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import { selectEntity, selectEntityView } from 'src/selectors';
import { Drawer } from '@blueprintjs/core';

import './PreviewEntity.scss';

const mapStateToProps = (state, ownProps) => {
  const { previewId, previewMode } = ownProps;
  return {
    entity: selectEntity(state, previewId),
    previewMode: selectEntityView(state, previewId, previewMode, true),
  };
};


export class PreviewEntity extends React.Component {
  renderContext() {
    const { entity, previewMode } = this.props;
    if (entity.isError) {
      return <ErrorSection error={entity.error} />;
    }
    if (entity.shouldLoad || entity.isLoading) {
      return <SectionLoading />;
    }
    return (
      <React.Fragment>
        <EntityHeading entity={entity} isPreview />
        <EntityViews entity={entity} activeMode={previewMode} isPreview />
      </React.Fragment>
    );
  }

  render() {
    const { previewId, entity, hidden } = this.props;
    return (
      <EntityContextLoader entityId={previewId}>
        <Drawer
          className="PreviewEntity"
          isOpen={!hidden}
          autoFocus={false}
          canOutsideClickClose
          canEscapeKeyClose
          enforceFocus={false}
          hasBackdrop={false}
          title={<EntityToolbar entity={entity} />}
          isCloseButtonShown={false}
          onClosing={() => console.log('on closing!')}
        >
          <DualPane.InfoPane className="with-heading">
            {this.renderContext()}
          </DualPane.InfoPane>
        </Drawer>
      </EntityContextLoader>
    );
  }
}

export default connect(mapStateToProps)(PreviewEntity);
