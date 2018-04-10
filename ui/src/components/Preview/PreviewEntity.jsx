import React from 'react';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';

import { fetchEntity } from 'src/actions';
import { selectEntity } from 'src/selectors';
import { EntityInfo } from 'src/components/Entity';
import { SectionLoading } from 'src/components/common';

class PreviewEntity extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded(this.props);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.previewId !== newProps.previewId) {
      this.fetchIfNeeded(newProps);
    }
  }

  fetchIfNeeded(props) {
    if (!props.entity || !props.entity.id) {
      props.fetchEntity({ id: props.previewId });
    }
  }

  render() {
    const { entity } = this.props;

    if (entity && entity.error) {
      return <NonIdealState
          title={entity.error}
      />
    }

    if (!entity || !entity.id) {
      return <SectionLoading/>;
    }
    return <EntityInfo entity={entity} showToolbar={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { entity: selectEntity(state, ownProps.previewId) };
};

PreviewEntity = connect(mapStateToProps, { fetchEntity })(PreviewEntity);
export default PreviewEntity;