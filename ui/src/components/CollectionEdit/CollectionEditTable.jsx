import React, {Component} from 'react';
import {NonIdealState} from '@blueprintjs/core';
import {FormattedMessage} from 'react-intl';

class CollectionEditTable extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    const {users} = this.props;
    const hasAlerts = !(users.results !== undefined && users.results.length === 0);

    if (!hasAlerts || users.results === undefined) {
      //return <NonIdealState visual="" title="There are no alerts"/>
    }

    return (
      <div>
        <div className='header_access_control'>
          <p className='header_label header_types'>
            <FormattedMessage id="collection.edit.types" defaultMessage="Types"/>
          </p>
          <p className='header_label header_edit'>
            <FormattedMessage id="collection.edit.view" defaultMessage="View"/>
          </p>
          <p className='header_label header_edit'>
            <FormattedMessage id="collection.edit.edit" defaultMessage="Edit"/>
          </p>
        </div>
        <div className='table_body'>
          <div key={1} className='table_row'>
            <p className='table_item_access_control header_topic'>
              States
            </p>
          </div>
          <div key={2} className='table_row'>
            <p className='table_item_access_control header_types'>
              All visitors
            </p>
            <p className='table_item_access_control header_edit'>
              <i className="fa fa-search" aria-hidden="true"/>
            </p>
            <p
              className='table_item_access_control header_edit'>
              <i className="fa fa-trash-o" aria-hidden="true"/>
            </p>
          </div>
          <div key={3} className='table_row'>
            <p className='table_item_access_control header_types'>
              Logged-in users
            </p>
            <p className='table_item_access_control header_edit'>
              <i className="fa fa-search" aria-hidden="true"/>
            </p>
            <p
              className='table_item_access_control header_edit'>
              <i className="fa fa-trash-o" aria-hidden="true"/>
            </p>
          </div>
          <div key={4} className='table_row'>
            <p className='table_item_alert header_topic'>
              Groups
            </p>
          </div>
          <div key={5} className='table_row'>
            <p className='table_item_alert header_topic'>
              Project Laundromat
            </p>
            <p className='table_item_alert header_delete_search'>
              <i className="fa fa-search" aria-hidden="true"/>
            </p>
            <p
              className='table_item_alert header_delete_search'>
              <i className="fa fa-trash-o" aria-hidden="true"/>
            </p>
          </div>
          <div key={6} className='table_row'>
            <p className='table_item_alert header_topic'>
              OCCRP Staff
            </p>
            <p className='table_item_alert header_delete_search'>
              <i className="fa fa-search" aria-hidden="true"/>
            </p>
            <p
              className='table_item_alert header_delete_search'>
              <i className="fa fa-trash-o" aria-hidden="true"/>
            </p>
          </div>
          <div key={7} className='table_row'>
            <p className='table_item_alert header_topic'>
              Users
            </p>
          </div>
          {/*{users.results.map((item) => (
            <div key={item.id} className='table_row'>
              <p className='table_item_alert header_topic'>
                {item.label}
              </p>
              <p className='table_item_alert header_delete_search'
                 onClick={() => this.onSearch(item.label)}>
                <i className="fa fa-search" aria-hidden="true"/>
              </p>
              <p
                className='table_item_alert header_delete_search'
                onClick={() => this.deleteAlert(item.id)}
              >
                <i className="fa fa-trash-o" aria-hidden="true"/>
              </p>
            </div>
          ))}*/}
        </div>
      </div>
    )
  }
}

export default CollectionEditTable;
