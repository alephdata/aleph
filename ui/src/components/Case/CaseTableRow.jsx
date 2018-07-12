import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Icon} from '@blueprintjs/core';

import { Date, Role, Collection } from 'src/components/common';
import DeleteDialog from 'src/dialogs/DeleteDialog/DeleteDialog';
import { deleteCollection } from 'src/actions';

class CaseTableRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deleteIsOpen: false
    };
    this.toggleDeleteCase = this.toggleDeleteCase.bind(this);
  }

  toggleDeleteCase() {
    this.setState({deleteIsOpen: !this.state.deleteIsOpen});
  }

  render() {
    const { collection } = this.props;
    
    return (
      <React.Fragment>
        <tr key={collection.id + '-meta'} className='nowrap'>
          <td className="schema">
            <Collection.Link collection={collection} />
          </td>
          <td className="roles">
            <Role.List roles={collection.team} icon={false} />
          </td>
          <td className="date">
            <Date value={collection.created_at}/>
          </td>
          <td>
            <a onClick={this.toggleDeleteCase}>
              <Icon icon="trash" />
            </a>
          </td>
          <DeleteDialog collection={collection}
                                  isOpen={this.state.deleteIsOpen}
                                  toggleDialog={this.toggleDeleteCase} />
        </tr>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({});
export default connect(mapStateToProps, {deleteCollection})(CaseTableRow);
