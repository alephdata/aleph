import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { ControlGroup, InputGroup } from '@blueprintjs/core';

import SearchAlert from 'components/SearchAlert/SearchAlert';
import ScopeSelect from 'components/Navbar/ScopeSelect';
import { selectSession } from 'selectors';
import { defineMessages, injectIntl } from 'react-intl';

import './ScopedSearchBox.scss';

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


class ScopedSearchBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = { queryText: '' };
    this.onSubmit = this.onSubmit.bind(this);
    this.onChangeScope = this.onChangeScope.bind(this);
    this.onQueryChange = this.onQueryChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextQueryText = nextProps.query ? nextProps.query.getString('q') : prevState.queryText;
    const queryChanged = !prevState || !prevState.prevQuery || prevState.prevQuery.getString('q') !== nextQueryText;
    return {
      prevQuery: nextProps.query,
      queryText: queryChanged ? nextQueryText : prevState.queryText,
      activeScope: nextProps.searchScopes[nextProps.searchScopes.length - 1],
    };
  }

  onQueryChange({ target }) {
    const { activeScope } = this.state;
    const queryText = target.value;
    this.setState({ queryText });

    if (activeScope.submitOnQueryChange) {
      this.onSearchSubmit({ queryText });
    }
  }

  onSubmit(event) {
    event.preventDefault();
    this.onSearchSubmit();
  }

  onSearchSubmit(override) {
    const nextScope = override?.scope || this.state.activeScope;
    const nextQueryText = override?.queryText === undefined
      ? this.state.queryText
      : override.queryText;

    nextScope.onSearch(nextQueryText);
  }

  onChangeScope(newScope) {
    this.onSearchSubmit({ scope: newScope });
  }

  render() {
    const { searchScopes, intl } = this.props;
    const { queryText, activeScope } = this.state;

    const placeholder = activeScope.label
      ? intl.formatMessage(messages.placeholder, { label: activeScope.label })
      : intl.formatMessage(messages.nolabel_placeholder);

    return (
      <form onSubmit={this.onSubmit} autoComplete="off">
        <ControlGroup vertical={false} fill>
          <ScopeSelect
            scopes={searchScopes}
            activeScope={activeScope}
            onChangeScope={this.onChangeScope}
          />
          <InputGroup
            fill
            id="search-box"
            leftIcon="search"
            placeholder={placeholder}
            rightElement={<SearchAlert queryText={queryText} />}
            value={queryText}
            onChange={this.onQueryChange}
            className="ScopedSearchBox"
          />
        </ControlGroup>
      </form>
    );
  }
}

const mapStateToProps = (state) => ({
  session: selectSession(state),
});


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(ScopedSearchBox);
