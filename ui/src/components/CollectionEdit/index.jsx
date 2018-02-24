import React, {Component} from 'react';
import {connect} from 'react-redux';
import { defineMessages, injectIntl} from "react-intl";
import { NonIdealState } from '@blueprintjs/core';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import DualPane from 'src/components/common/DualPane';
import CollectionEditContent from './CollectionEditContent';
import CollectionEditInfo from './CollectionEditInfo';
import ScreenLoading from 'src/components/common/ScreenLoading';

import { fetchCollection } from 'src/actions';

const messages = defineMessages({
  access_error: {
    id: 'collection.edit.access_error',
    defaultMessage: 'You cannot edit this collection.',
  },
});

class CollectionEditScreen extends Component {
  constructor(){
    super();

    this.state = {
      collection: {}
    };

    this.onChangeCollection = this.onChangeCollection.bind(this);
  }

  componentDidMount() {
    const { collectionId } = this.props;
    this.props.fetchCollection({ id: collectionId });
  }

  componentWillReceiveProps(nextProps) {
    if(this.props !== nextProps) {
      this.setState({collection: nextProps.collection});
    }
  }

  onChangeCollection(collection) {
    this.setState({collection})
  }

  render() {
    const { intl, collection } = this.props;

    if (!collection || !collection.id) {
      return <ScreenLoading />;
    }

    if(!collection.writeable) {
      return <NonIdealState
        visual="error"
        title={intl.formatMessage(messages.access_error)}/>
    }

    return (
      <Screen>
        <Breadcrumbs collection={collection} />
        <DualPane>
          <CollectionEditInfo onChangeCollection={this.onChangeCollection} collection={collection}/>
          <CollectionEditContent collection={this.state.collection}/>
        </DualPane>
      </Screen>

    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const collection = state.collections[collectionId];
  return {collectionId, collection };
};

export default connect(mapStateToProps, { fetchCollection })(injectIntl(CollectionEditScreen));
