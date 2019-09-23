import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import EntityContextLoader from 'src/components/Entity/EntityContextLoader';
import EntityHeading from 'src/components/Entity/EntityHeading';
import EntityToolbar from 'src/components/Entity/EntityToolbar';
import EntityViews from 'src/components/Entity/EntityViews';
import { DualPane, SectionLoading, ErrorSection } from 'src/components/common';
import { selectEntity, selectEntityView } from 'src/selectors';
import { Drawer } from '@blueprintjs/core';
import queryString from 'query-string';

import './PreviewEntity.scss';

const mapStateToProps = (state, ownProps) => {
  const { previewId, previewMode } = ownProps;
  return {
    entity: selectEntity(state, previewId),
    previewMode: selectEntityView(state, previewId, previewMode, true),
  };
};

export class PreviewEntity extends React.Component {
  constructor(props) {
    super(props);

    this.onClose = this.onClose.bind(this);
  }

  onClose(event) {
    // don't close preview if other entity label is clicked
    if (event.target.classList.contains('EntityLabel')) {
      return;
    }

    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:type'] = undefined;
    parsedHash['preview:mode'] = undefined;
    parsedHash.page = undefined;

    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

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
          title={<EntityToolbar entity={entity} />}
          onClose={this.onClose}
          hasBackdrop={false}
          autoFocus={false}
          enforceFocus={false}
          // canOutsideClickClose={false}
          portalClassName="PreviewEntity__overlay-container"
        >
          <DualPane.InfoPane className="with-heading">
            {this.renderContext()}
          </DualPane.InfoPane>
        </Drawer>
      </EntityContextLoader>
    );
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps),
)(PreviewEntity);
