import React from 'react';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import { CollectionInfo } from 'src/components/Collection';
import { SectionLoading } from 'src/components/common';

class PreviewCollection extends React.Component {

  componentDidMount() {
    this.fetchIfNeeded(this.props);
  }

  componentWillReceiveProps(newProps) {
    if (this.props.previewId !== newProps.previewId) {
      this.fetchIfNeeded(newProps);
    }
  }

  fetchIfNeeded(props) {
    if (!props.collection || !props.collection.id) {
      props.fetchCollection({ id: props.previewId });
    }
  }

  render() {
    const { collection } = this.props;

    if (collection && collection.error) {
      return <NonIdealState
            title={collection.error}
        />
    }

    if (!collection || !collection.id) {
      return <SectionLoading/>;
    }
    return <CollectionInfo collection={collection} showToolbar={true} />;
  }
}

const mapStateToProps = (state, ownProps) => {
  return { collection: selectCollection(state, ownProps.previewId) };
};

PreviewCollection = connect(mapStateToProps, { fetchCollection })(PreviewCollection);
export default PreviewCollection;