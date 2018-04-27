import React, {Component} from 'react';
import {connect} from 'react-redux';
import {injectIntl, FormattedMessage, defineMessages} from 'react-intl';
import {debounce} from 'lodash';
import {NonIdealState, Button, Alert} from '@blueprintjs/core';
import pallete from 'google-palette';

import {queryCollections, deleteCollection} from 'src/actions';

import {selectCollectionsResult} from 'src/selectors';
import {Screen, Breadcrumbs, SinglePane, SectionLoading} from 'src/components/common';
import CaseIndexTable from "src/components/CaseIndexTable/CaseIndexTable";
import Query from "src/app/Query";
import CaseExplanationBox from "../../components/Case/CaseExplanationBox";
import CreateCaseDialog from 'src/dialogs/CreateCaseDialog/CreateCaseDialog';

import './CasesIndexScreen.css';
import {showSuccessToast} from "../../app/toast";

const messages = defineMessages({
  no_results_title: {
    id: 'cases.no_results_title',
    defaultMessage: 'No cases',
  },
  no_results_description: {
    id: 'cases.no_results_description',
    defaultMessage: 'Try adding new case.',
  },
  save_success: {
    id: 'cases.edit.save_success',
    defaultMessage: 'Your deleted case.',
  },
  save_error: {
    id: 'cases.edit.save_error',
    defaultMessage: 'Failed to delete case.',
  }
});

class CasesIndexScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dialogIsOpen: false,
      alertIsOpen: false,
      casefile: {}
      //queryPrefix: props.query.getString('prefix')
    };

    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
    this.toggleCreateCase = this.toggleCreateCase.bind(this);
    this.toggleAlert = this.toggleAlert.bind(this);
    this.onDeleteCase = this.onDeleteCase.bind(this);
  }

  async componentDidMount() {
    await this.fetchData();
  }

  componentWillReceiveProps(nextProps) {
    console.log(this.props, nextProps)
      //this.fetchData();
  }

  async fetchData() {
    let {query} = this.props;
    await this.props.queryCollections({query});
  }

  updateQuery(newQuery) {
    const {history, location} = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  toggleCreateCase() {
    this.setState({dialogIsOpen: !this.state.dialogIsOpen});
  }

  toggleAlert(casefile) {
    this.setState({
      alertIsOpen: !this.state.alertIsOpen,
      casefile: casefile !== undefined ? casefile : {}
    });
  }

  async onDeleteCase() {
    const {casefile} = this.state;
    const {intl} = this.props;

    try {
      await this.props.deleteCollection(casefile);
      await this.fetchData();
      showSuccessToast(intl.formatMessage(messages.save_success));
    } catch (e) {
      alert(intl.formatMessage(messages.save_error));
    }
  }

  render() {
    const {result, query, intl} = this.props;
    const {dialogIsOpen, alertIsOpen} = this.state;
    const hasCases = result.total !== 0;

    let scheme = pallete.listSchemes('mpn65')[0];
    let colors = scheme.apply(scheme, [result.total]);

    const breadcrumbs = (<Breadcrumbs>
      <li>
        <a className="pt-breadcrumb">
          <FormattedMessage id="cases.browser.breadcrumb"
                            defaultMessage="Cases overview"/>
        </a>
      </li>
    </Breadcrumbs>);

    return (
      <Screen className="CasesIndexScreen" breadcrumbs={breadcrumbs}>
        <SinglePane>
          <Alert isOpen={alertIsOpen} onClose={this.toggleAlert} cancelButtonText='Cancel' confirmButtonText='Confirm' onConfirm={this.onDeleteCase}>
            <p>
              <FormattedMessage id="cases.browser.alert"
                                defaultMessage="Are you sure you want to delete this case and"/>&nbsp;
              <b>
                <FormattedMessage id="cases.browser.all.files" defaultMessage="all files"/></b>&nbsp;
              <FormattedMessage id="cases.browser.within" defaultMessage="within it?"/>
            </p>
          </Alert>
            <CreateCaseDialog
              isOpen={dialogIsOpen}
              toggleDialog={this.toggleCreateCase}
            />
            <CaseExplanationBox hasCases={hasCases} toggleCreateCase={this.toggleCreateCase}/>
            {result.total !== 0 && <CaseIndexTable query={query}
                                                   colors={colors}
                                                   updateQuery={this.updateQuery}
                                                   result={result}
                                                   deleteCase={this.toggleAlert}/>}
            {result.total === 0 && (
              <div className='error-and-add-button'>
                <NonIdealState visual="search"
                               title={intl.formatMessage(messages.no_results_title)}
                               description={intl.formatMessage(messages.no_results_description)}/>
                <Button onClick={this.toggleCreateCase} icon="plus" className="add-case-button pt-intent-primary">
                  <FormattedMessage id="case.add" defaultMessage="Add new case"/>
                </Button>
              </div>
            )}
            {result.total === undefined && (
              <SectionLoading/>
            )}
        </SinglePane>
      </Screen>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const context = {
    facet: ['category', 'countries'],
    'filter:kind': 'casefile'
  };
  const query = Query.fromLocation('collections', ownProps.location, context, 'collections')
    .sortBy('count', true)
    .limit(30);
  console.log('ovdje', selectCollectionsResult(state, query))

  return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
};

CasesIndexScreen = injectIntl(CasesIndexScreen);
CasesIndexScreen = connect(mapStateToProps, {queryCollections, deleteCollection})(CasesIndexScreen);
export default CasesIndexScreen;
