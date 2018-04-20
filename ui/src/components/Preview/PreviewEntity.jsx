import React from 'react';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';

import { fetchEntity } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { EntityInfo } from 'src/components/Entity';
import { SectionLoading } from 'src/components/common';

class PreviewEntity extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    if (this.props.previewId !== prevProps.previewId) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    const { entity, previewId } = this.props;
    if (!entity || !entity.id) {
      this.props.fetchEntity({ id: previewId });
    }
  }

  render() {
    const { entity } = this.props;

    if (entity && entity.error) {
      return <NonIdealState
          title={entity.error}
      />
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

PreviewEntity = connect(mapStateToProps, { fetchEntity }, null, { pure: false })(PreviewEntity);
export default PreviewEntity;