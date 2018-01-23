import React, { Component } from 'react';
import {AnchorButton, NonIdealState} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';
import messages from 'src/content/messages';
import { connect } from 'react-redux';
import { fetchAlerts, addAlert, deleteAlert } from 'src/actions';
import { withRouter } from 'react-router';
import queryString from 'query-string';

import DualPane from 'src/components/common/DualPane';

import './AlertsScreen.css';

class AlertsScreen extends Component {

    constructor(){
        super();

        this.state = {
            newAlert: ''
        };

        this.deleteAlert = this.deleteAlert.bind(this);
        this.onAddAlert = this.onAddAlert.bind(this);
        this.onChangeAddingInput = this.onChangeAddingInput.bind(this);
        this.onSearch = this.onSearch.bind(this);
    }

    componentDidMount() {
        this.props.fetchAlerts();
    }

    deleteAlert(id, event) {
        this.props.deleteAlert(id);
    }

    onAddAlert(event) {
        event.preventDefault();
        this.props.addAlert({query_text: this.state.newAlert});
        this.setState({newAlert: ''})
    }

    onChangeAddingInput({target}) {
        this.setState({newAlert: target.value})
    }

    onSearch(alert, event) {
        const {history} = this.props;
        history.push({
            pathname: '/search',
            search: queryString.stringify({
                q: alert
            })
        });
        event.preventDefault();
    }

    render() {
        const { alerts } = this.props;
        let alertsTable = [];
        let deleteAlert = this.deleteAlert;
        let searchAlert = this.onSearch;

        if(alerts.results !== undefined) {
            if (alerts.results.length === 0) {
                alertsTable = <NonIdealState visual=""
                                             title="There are no alerts"/>
            } else {
                alertsTable = <div>
                    <div className='header_alerts'>
                        <p className='header_label header_topic'>Topic</p>
                        <p className='header_label header_delete_search'>Search</p>
                        <p className='header_label header_delete_search'>Delete</p>
                    </div>
                    <div className='table_body_alerts'>
                        {alerts.results.map(function (item, index) {
                            return <div key={index} className='table_row'>
                                <p className='table_item_alert header_topic'>{item.label}</p>
                                <p className='table_item_alert header_delete_search' onClick={searchAlert.bind(this, item.label)}><i className="fa fa-search" aria-hidden="true"/></p>
                                <p key={index} className='table_item_alert header_delete_search' onClick={deleteAlert.bind(this, item.id)}><i className="fa fa-trash-o" aria-hidden="true"/></p>
                            </div>
                        })}
                    </div>
                </div>
            }
        }


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
                        <form onSubmit={this.onAddAlert} className="search_form">
                        <div className="pt-form-content add_topic">
                            <input id="add_alert"
                                   className="pt-input add_topic_input"
                                   placeholder="Add topic to the list"
                                   type="text"
                                   dir="auto"
                                   onChange={this.onChangeAddingInput}
                                   value={this.state.newAlert} />
                        </div>
                        </form>
                        <div className="pt-button-group pt-fill alerts_button_div" onClick={this.onAddAlert}>
                            <AnchorButton
                                className="alerts_anchor_button">
                                Add
                            </AnchorButton>
                        </div>
                    </div>
                </div>
                {alertsTable}

            </DualPane.ContentPane>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        alerts: state.alerts
    }
};

AlertsScreen = withRouter(AlertsScreen);
export default connect(mapStateToProps, { fetchAlerts, addAlert, deleteAlert })(injectIntl(AlertsScreen));
