import React, {Component} from 'react';
import {connect} from 'react-redux';

import { fetchCollection } from 'src/actions';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import CollectionEditContent from './CollectionEditContent';
import CollectionEditInfo from './CollectionEditInfo';

class CollectionEditScreen extends Component {
  constructor(){
    super();

    this.state = {
      collection: {}
    }
  }

  componentDidMount() {
    const { collectionId } = this.props;
    this.props.fetchCollection({ id: collectionId });
    //this.setState({collection: this.props.collection})
  }

  render() {
    const { location, collection } = this.props;
    //const {collection} = this.state;

    return (
      <Screen>
        <Breadcrumbs collection={{label: 'Collection Settings', links: {ui: 'http://localhost:8080' + location.pathname}}} />
        <DualPane>
          <CollectionEditInfo collection={collection}/>
          <CollectionEditContent collection={collection}/>
        </DualPane>
      </Screen>

    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const collection = state.collections[collectionId];
  return { collectionId, collection, app: state.metadata.app };
};

export default connect(mapStateToProps, { fetchCollection })(CollectionEditScreen);
