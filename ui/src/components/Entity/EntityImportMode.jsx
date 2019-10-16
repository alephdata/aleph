import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { fetchCollectionMappings } from 'src/actions';
import { selectCollectionMappings } from 'src/selectors';
import EntityImportListings from './EntityImportListings';
import EntityImportEditor from './EntityImportEditor';


import './EntityImportMode.scss';


export class EntityImportMode extends Component {
  componentDidMount() {
    this.props.fetchCollectionMappings(this.props.entity.collection.id);
  }

  deleteListing(item) {
    console.log('deleting', item, this);
  }

  render() {
    console.log('mappings', this.props.mappings);
    const { mappings } = this.props;

    return (
      <div>
        {mappings && mappings.length > 0 && (
          <div>
            <h5>Existing mappings</h5>
            <EntityImportListings items={mappings} onDelete={this.deleteListing} />
          </div>
        )}
        <div>
          <EntityImportEditor />
        </div>
      </div>
    );
  }
}

const mapDispatchToProps = { fetchCollectionMappings };

const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.entity.collection.id;
  return { mappings: selectCollectionMappings(state, collectionId) };
};

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(EntityImportMode);
