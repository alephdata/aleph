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
  nolabel_placeholder: {
    id: 'search.nolabel_placeholder',
    defaultMessage: 'Search companies, people and documents',
  },
  placeholder: {
    id: 'search.placeholder',
    defaultMessage: 'Search in {label}',
  },
});

class SearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeScope: props.searchScopes[props.searchScopes.length - 1],
    };
    this.changeSearchScope = this.changeSearchScope.bind(this);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  /* eslint-disable react/no-did-update-set-state */
  componentDidUpdate(prevProps) {
    const { searchScopes } = this.props;

    if (prevProps.location !== this.props.location) {
      this.setState({
        activeScope: searchScopes[searchScopes.length - 1],
      });
    }
    this.fetchIfNeeded();
  }

  onChange = newSearchValue => this.props.updateSearchValue(newSearchValue);

  onItemSelect = ({ query }) => {
    const { doSearch, updateSearchValue } = this.props;
    updateSearchValue(query);
    doSearch(query, this.state.activeScope);
  };

  onSearchSubmit = (scope) => {
    const { searchValue, doSearch, updateSearchValue } = this.props;
    updateSearchValue(searchValue);
    doSearch(searchValue, scope || this.state.activeScope);
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

  fetchIfNeeded() {
    const { queryLogs, session, query } = this.props;
    if (session.loggedIn && queryLogs.shouldLoad) {
      this.props.fetchQueryLogs({ query, next: queryLogs.next });
    }
  }

  changeSearchScope(newScope) {
    this.onSearchSubmit(newScope);
  }

  render() {
    const {
      props: { searchValue, searchScopes, inputClasses, intl, hideScopeMenu, toggleSearchTips },
      state: { activeScope },
      itemRenderer, onChange,
      itemListPredicate,
      onItemSelect,
    } = this;

    const multipleScopes = searchScopes.length > 1;

    const inputProps = {
      type: 'text',
      className: `bp3-fill ${inputClasses}`,
      leftIcon: 'search',
      placeholder: activeScope.label
        ? intl.formatMessage(messages.placeholder, { label: activeScope.label })
        : intl.formatMessage(messages.nolabel_placeholder),
      rightElement: <SearchAlert queryText={searchValue} />,
      value: searchValue,
      id: 'search-box',
    };

    const popoverProps = {
      popoverClassName: 'search-popover',
      targetTagName: 'div',
      fill: true,
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
              text={activeScope.listItem}
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
