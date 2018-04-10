import React from 'react';
import { connect } from 'react-redux';

import { fetchCollection } from 'src/actions';
import { selectCollection } from 'src/selectors';
import CollectionInfo from 'src/screens/CollectionScreen/CollectionInfo';
import SectionLoading from 'src/components/common/SectionLoading';
import ErrorScreen from 'src/components/ErrorMessages/ErrorScreen';


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
    if (collection && collection.status === 'error') {
      return <ErrorScreen.EmptyList title={collection.message} />
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