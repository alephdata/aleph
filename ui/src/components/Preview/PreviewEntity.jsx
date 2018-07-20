import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { fetchEntity } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { EntityInfo } from 'src/components/Entity';
import { SectionLoading, ErrorSection } from 'src/components/common';

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
    const { entity } = this.props;
    if (entity.isError) {
      return <ErrorSection error={entity.error} />
    }
    if (entity.id === undefined) {
      return <SectionLoading/>;
    }
    return <EntityInfo entity={entity} showToolbar={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { entity: selectEntity(state, ownProps.previewId) };
};

PreviewEntity = connect(mapStateToProps, { fetchEntity })(PreviewEntity);
PreviewEntity = withRouter(PreviewEntity);
export default PreviewEntity;