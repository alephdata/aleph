import React, {Component} from 'react';
import {connect} from 'react-redux';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';

import DualPane from 'src/components/common/DualPane';

class CollectionEditInfo extends Component {
  constructor(props) {
    super(props);

  }

  render() {

    return (
      <DualPane.InfoPane className="CollectionEditInfo">
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
};

export default connect(mapStateToProps)(injectIntl(CollectionEditInfo));
