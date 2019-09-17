import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import c from 'classnames';

import { MenuItem } from '@blueprintjs/core/lib/esm/components/menu/menuItem';
import { Button } from '@blueprintjs/core/lib/esm/components/button/buttons';
import {
  ControlGroup,
} from '@blueprintjs/core';
import { Select } from '@blueprintjs/select';

import { Suggest } from 'src/components/common/Suggest';
import SearchAlert from 'src/components/SearchAlert/SearchAlert';
import Query from 'src/app/Query';
import { selectQueryLogsLimited, selectSession } from 'src/selectors';
import { deleteQueryLog, fetchQueryLogs } from 'src/actions/queryLogsActions';
import { defineMessages, injectIntl } from 'react-intl';

import './ScopedSearchBox.scss';

const ICON_VIRTUAL_SUGGEST = 'edit';
const ICON_EXISTING_SUGGEST = undefined;

const messages = defineMessages({
  placeholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search in {label}',
  },
});

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currScope: props.searchScopes[props.searchScopes.length - 1],
    };

    this.changeSearchScope = this.changeSearchScope.bind(this);
  }

  componentDidMount() {
    const {
      queryLogs, session, query,
    } = this.props;
    if (session.loggedIn && !queryLogs.isLoading && queryLogs.shouldLoad) {
      this.props.fetchQueryLogs({ query, next: queryLogs.next });
    }
  }

  /* eslint-disable react/no-did-update-set-state */
  componentDidUpdate(prevProps) {
    const { searchScopes } = this.props;

    if (searchScopes.length !== prevProps.searchScopes.length) {
      this.setState({
        currScope: searchScopes[searchScopes.length - 1],
      });
    }
  }

  onChange = newSearchValue => this.props.updateSearchValue(newSearchValue);

  onItemSelect = ({ query }) => {
    this.props.updateSearchValue(query);
    this.props.doSearch(query, this.state.currScope);
  };

  onSearchSubmitClick = () => {
    const { searchValue, doSearch } = this.props;
    this.props.updateSearchValue(searchValue);
    doSearch(searchValue, this.state.currScope);
  }

  deleteQueryLog = queryLogItem => (event) => {
    event.stopPropagation();
    this.props.deleteQueryLog(queryLogItem);
  };

  RemoveQueryLog = ({ queryItem }) => (
    <Button
      className="querylog-remove"
      minimal
      small
      onClick={this.deleteQueryLog(queryItem)}
      icon="cross"
    />
  )

  renderScopeItem = (scope, { index }) => (
    <MenuItem
      key={index}
      onClick={() => this.changeSearchScope(scope)}
      text={scope.listItem}
    />
  )

  itemRenderer = (queryItem, { handleClick, modifiers }) => {
    const icon = queryItem.isVirtual ? ICON_VIRTUAL_SUGGEST : ICON_EXISTING_SUGGEST;
    const props = {
      active: modifiers.active,
      className: 'navbar-search-item',
      key: queryItem.query,
      onClick: handleClick,
      text: queryItem.query,
      labelElement: <this.RemoveQueryLog queryItem={queryItem} />,
      icon,
    };
    return <MenuItem {...props} />;
  };

  itemListPredicate = (query, queryList) => (
    query ? [{ query, isVirtual: true }] : [{ query: '' }, ...queryList]
  )

  changeSearchScope(newScope) {
    this.setState({ currScope: newScope });
  }

  render() {
    const {
      props: { searchValue, searchScopes, inputClasses, intl, hideScopeMenu, toggleSearchTips },
      state: { currScope },
      itemRenderer, onChange,
      itemListPredicate,
      onItemSelect,
    } = this;

    const multipleScopes = searchScopes.length > 1;

    const inputProps = {
      type: 'text',
      className: `bp3-fill ${inputClasses}`,
      leftIcon: 'search',
      placeholder: intl.formatMessage(messages.placeholder, { label: currScope.label }),
      rightElement: <SearchAlert queryText={searchValue} />,
      value: searchValue,
      id: 'search-box',
    };

    const popoverProps = {
      popoverClassName: 'search-popover',
      targetTagName: 'div',
      fill: true,
      // usePortal: false,
      modifiers: {
        arrow: { enabled: false },
      },
    };

    if (!this.props.session.loggedIn || searchValue) {
      Object.assign(popoverProps, { isOpen: false });
    }

    return (
      <ControlGroup className="SearchBox" vertical={false} fill>
        {!hideScopeMenu && (
          <Select
            filterable={false}
            items={searchScopes}
            itemRenderer={this.renderScopeItem}
            popoverProps={{ minimal: true, className: 'SearchBox__scoped-input__popover', usePortal: false }}
            disabled={!multipleScopes}
          >
            <Button
              className={c('SearchBox__scoped-input__scope-button', { unclickable: !multipleScopes })}
              text={currScope.listItem}
              rightIcon={multipleScopes ? 'caret-down' : null}
            />
          </Select>
        )}
        <Suggest
          inputProps={inputProps}
          popoverProps={popoverProps}
          searchScopes={searchScopes}
          items={this.props.queryLogs.results}
          itemRenderer={itemRenderer}
          inputValueRenderer={({ text }) => text}
          onQueryChange={onChange}
          query={searchValue}
          itemListPredicate={itemListPredicate}
          className="navbar-search-input"
          onItemSelect={onItemSelect}
          resetOnQuery
        />
        {!hideScopeMenu && (
          <Button
            className="SearchBox__search-tips bp3-fixed"
            icon="help"
            minimal
            onClick={toggleSearchTips}
          />
        )}
      </ControlGroup>
    );
  }
}

const mapStateToProps = state => ({
  session: selectSession(state),
  queryLogs: selectQueryLogsLimited(state),
  query: Query.fromLocation('querylog', window.location, {}, 'querylog')
    .limit(20),
});

const mapDispatchToProps = ({
  fetchQueryLogs,
  deleteQueryLog,
});


export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(SearchBox);
