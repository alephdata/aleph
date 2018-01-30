import React, {Component} from 'react';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';
import {connect} from 'react-redux';

import DualPane from 'src/components/common/DualPane';

class CollectionEditContent extends Component {

  constructor(props) {
    super(props);
  }

  render() {

    return (
      <DualPane.ContentPane isLimited={true} className="CollectionEditContent">
        <div className='main_div'>

        </div>
      </DualPane.ContentPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
});

CollectionEditContent = injectIntl(CollectionEditContent);
export default connect(mapStateToProps)(CollectionEditContent);
