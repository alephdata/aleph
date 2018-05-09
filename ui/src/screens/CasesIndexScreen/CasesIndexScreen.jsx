import React, {Component} from 'react';
import {connect} from 'react-redux';
import {injectIntl, FormattedMessage, defineMessages} from 'react-intl';
import {debounce} from 'lodash';
import {NonIdealState, Button, Alert} from '@blueprintjs/core';

import {queryCollections, deleteCollection, updateCollectionPermissions, createCollection} from 'src/actions';

import {selectCollectionsResult} from 'src/selectors';
import {Screen, Breadcrumbs, SinglePane, SectionLoading} from 'src/components/common';
import CaseIndexTable from "src/components/CaseIndexTable/CaseIndexTable";
import Query from "src/app/Query";
import { CaseExplanationBox } from "src/components/Case";
import CreateCaseDialog from 'src/dialogs/CreateCaseDialog/CreateCaseDialog';
import {showSuccessToast} from "src/app/toast";
import { getColors } from 'src/util/colorScheme';

import './CasesIndexScreen.css';

const messages = defineMessages({
  no_results_title: {
    id: 'cases.no_results_title',
    defaultMessage: 'No cases',
  },
  no_results_description: {
    id: 'cases.no_results_description',
    defaultMessage: 'Try adding new case.',
  },
  delete_success: {
    id: 'cases.edit.save_success',
    defaultMessage: 'Your deleted case.',
  },
  delete_error: {
    id: 'cases.edit.save_error',
    defaultMessage: 'Failed to delete case.',
  },
  save_success: {
    id: 'case.save_success',
    defaultMessage: 'You have created a case.',
  },
  save_error: {
    id: 'case.save_error',
    defaultMessage: 'Failed to create a case.',
  },
  filter: {
  id: 'navbar.search_cases_placeholder',
    defaultMessage: 'Search cases'
}
});

class CasesIndexScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dialogIsOpen: false,
      alertIsOpen: false,
      casefile: {},
      result: [],
      queryPrefix: props.query.getString('prefix')
    };

    this.toggleCreateCase = this.toggleCreateCase.bind(this);
    this.toggleAlert = this.toggleAlert.bind(this);
    this.onDeleteCase = this.onDeleteCase.bind(this);
    this.onAddCase = this.onAddCase.bind(this);
    this.onChangeQueryPrefix = this.onChangeQueryPrefix.bind(this);
    this.updateQuery = debounce(this.updateQuery.bind(this), 200);
  }

  async componentDidMount() {
    await this.fetchData();
  }

  componentWillReceiveProps(nextProps) {
    if (this.state.result.results !== undefined)
      if (this.state.result.results.length !== nextProps.result.results.length || nextProps.result.results !== undefined) {
        this.setState({result: nextProps.result})
      }
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  fetchIfNeeded() {
    let { query, result } = this.props;
    if (result.total === undefined && !result.isLoading) {
      this.props.queryCollections({ query });
    }
  }

  async fetchData() {
    let {query} = this.props;
    this.props.queryCollections({query});
    this.setState({result: this.props.result})
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
      showSuccessToast(intl.formatMessage(messages.delete_success));
    } catch (e) {
      alert(intl.formatMessage(messages.delete_error));
    }
  }

  async onAddCase(collection, permissions) {
    const {intl, updateCollectionPermissions, createCollection} = this.props;
    try {
      let createdCollection = await createCollection(collection);
      await updateCollectionPermissions(createdCollection.data.id, permissions);
      await this.fetchData();
      this.toggleCreateCase();
      showSuccessToast(intl.formatMessage(messages.save_success));
    } catch (e) {
      alert(intl.formatMessage(messages.save_error));
    }
  }

  onChangeQueryPrefix({target}) {
    this.setState({queryPrefix: target.value});
    const query = this.props.query.set('prefix', target.value);
    this.updateQuery(query);
  }

  updateQuery(newQuery) {
    const {history, location} = this.props;
    history.push({
      pathname: location.pathname,
      search: newQuery.toLocation()
    });
  }

  render() {
    const {query, intl} = this.props;
    const {dialogIsOpen, alertIsOpen, result, queryPrefix} = this.state;
    const hasCases = result.total !== 0;

    let colors = getColors();

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
          <Alert isOpen={alertIsOpen} onClose={this.toggleAlert} cancelButtonText='Cancel' confirmButtonText='Confirm'
                 onConfirm={this.onDeleteCase}>
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
            onAddCase={this.onAddCase}
            toggleDialog={this.toggleCreateCase}
          />
          <CaseExplanationBox hasCases={hasCases} toggleCreateCase={this.toggleCreateCase}/>
          <div className="pt-input-group filter-cases">
            <i className="pt-icon pt-icon-search"/>
            <input className="pt-input" type="search"
                   placeholder={intl.formatMessage(messages.filter)}
                   onChange={this.onChangeQueryPrefix} value={queryPrefix}/>
          </div>
          {result.total !== 0 && <CaseIndexTable query={query}
                                                 colors={colors}
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
  const {location} = ownProps;
  const context = {
    facet: ['category', 'countries'],
    'filter:kind': 'casefile'
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('count', true)
    .limit(30);

  return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
};

CasesIndexScreen = injectIntl(CasesIndexScreen);
CasesIndexScreen = connect(mapStateToProps, {
  queryCollections,
  deleteCollection,
  updateCollectionPermissions,
  createCollection
})(CasesIndexScreen);
export default CasesIndexScreen;
