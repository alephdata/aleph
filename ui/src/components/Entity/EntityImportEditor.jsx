import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { fetchCollectionMappings } from 'src/actions';
import { Card } from '@blueprintjs/core';


export class EntityImportEditor extends Component {
  render() {
    return (
      <div>
        <h5>Create new mapping</h5>
        <Card>
          test
        </Card>
      </div>
    );
  }
}

const mapDispatchToProps = { fetchCollectionMappings };

const mapStateToProps = () => {
  console.log('');
  return {};
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityImportEditor);
