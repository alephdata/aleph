import React, { Component } from 'react';
import {AnchorButton} from '@blueprintjs/core';

import DualPane from 'src/components/common/DualPane';

import './AlertsScreen.css';

const mockupList = ['emina', 'muratovic', 'test', 'dva', 'tri', 'cetiri', 'pet', 'sest', 'dhjshkhkhdha', 'lahskjakskagdkagsdkgdags', 'jashdahsdkhaskjkhasdkh'];

class AlertsScreen extends Component {
    render() {
        const { profileId } = this.props;

        return (
            <DualPane.ContentPane>
                <div className='main_div'>
                    {/*<div className='title_div'>
                        <h1 className='alerts_title'>
                            Alerts & Notifications
                        </h1>
                        <div className="pt-form-content search_alerts">
                            <input id="filter_alerts" className="pt-input search_alerts_input"
                                   placeholder="Filter alerts" type="text" dir="auto"/>
                        </div>
                    </div>*/}
                    <div className='add_topic_div'>
                        <div className="pt-form-content add_topic">
                            <input id="add_alert" className="pt-input add_topic_input"
                                   placeholder="Add topic to the list" type="text" dir="auto"/>
                        </div>
                        <div className="pt-button-group pt-fill alerts_button_div">
                            <AnchorButton
                                href='/'
                                className="alerts_anchor_button">
                                Add
                            </AnchorButton>
                        </div>
                    </div>
                </div>
                <div>
                    <div className='header_alerts'>
                        <p className='header_label header_topic'>Topic</p>
                        <p className='header_label header_delete_search'>Search</p>
                        <p className='header_label header_delete_search'>Delete</p>
                    </div>
                    <div className='table_body_alerts'>
                        {mockupList.map(function (item, index) {
                            return <div key={index} className='table_row'>
                                <p className='table_item_alert header_topic'>{item}</p>
                                <p className='table_item_alert header_delete_search'><i className="fa fa-search" aria-hidden="true"/></p>
                                <p className='table_item_alert header_delete_search'><i className="fa fa-trash-o" aria-hidden="true"/></p>
                            </div>
                        })}
                    </div>
                </div>

            </DualPane.ContentPane>
        );
    }
}

export default AlertsScreen;
