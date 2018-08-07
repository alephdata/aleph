import React, { Component } from 'react';
import {connect} from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Button, MenuItem, Position, Classes, Alignment } from "@blueprintjs/core";
import { Select as BlueprintSelect } from "@blueprintjs/select";

import wordList from 'src/util/wordList';
import { suggestRoles } from "src/actions";

import './Role.css';

const messages = defineMessages({
  label: {
    id: 'role.select.user',
    defaultMessage: 'Choose a user',
  },
  suggest_initial: {
    id: 'role.begin.typing',
    defaultMessage: 'Search by name or email',
  },
  no_results: {
    id: 'role.no.results',
    defaultMessage: 'No match, keep typing',
  }
});


class Label extends Component {
  shouldComponentUpdate(nextProps) {
    return this.props.role.id !== nextProps.role.id;
  }

  render() {
    const { role, icon = true, long = false } = this.props;
    if (!role) {
      return null;
    }
    return (
      <React.Fragment>
        { icon && (
          <React.Fragment>
            <i className='fa fa-fw fa-user-circle-o' />
            {' '}
          </React.Fragment>
        )}
        { long ? role.label : role.name }
      </React.Fragment>
    );
  }
}


class List extends Component {
  render() {
    const { roles, truncate = Infinity } = this.props;
    if (!roles) return null;

    let names = roles.map((role, i) => {
      return <Label key={role.id} role={role} {...this.props} />;
    });

    // Truncate if too long
    if (names.length > truncate) {
      names = [...names.slice(0, truncate), '…'];
    }
    return wordList(names, ', ');
  }
}


class Select extends Component {

  constructor(props) {
    super(props);
    this.state = {
      suggested: [],
    };
    this.renderRole = this.renderRole.bind(this);
    this.onSuggest = this.onSuggest.bind(this);
    this.onSelectRole = this.onSelectRole.bind(this);
  }

  async onSuggest(query) {
    if (query.length <= 3) {
      return;
    }
    const { exclude = [] } = this.props;
    const roles = await this.props.suggestRoles(query, exclude);
    this.setState({
      suggested: roles.results
    })
  }

  onSelectRole(role) {
    this.props.onSelect(role);
  }

  renderRole(role, { handleClick, modifiers }) {
    return <MenuItem className={modifiers.active ? Classes.ACTIVE : ""}
                     key={role.id}
                     onClick={handleClick}
                     text={role.label} />;
  }

  render () {
    const { intl, role } = this.props;
    const { suggested } = this.state;
    const label = role ? role.label : intl.formatMessage(messages.label);
  
    return <BlueprintSelect
              initialContent={
                <MenuItem disabled={true} text={intl.formatMessage(messages.suggest_initial)} />
              }
              noResults={
                <MenuItem disabled={true} text={intl.formatMessage(messages.no_results)} />
              }
              itemRenderer={this.renderRole}
              items={suggested}
              onItemSelect={this.onSelectRole}
              onQueryChange={this.onSuggest}
              popoverProps={{
                position: Position.BOTTOM_LEFT,
                className: "RoleSelect",
                usePortal: false
              }}
              filterable={true}
              resetOnClose={true}
              resetOnSelect={true}>
      <Button text={label}
              className="pt-fill"
              alignText={Alignment.LEFT}
              rightIcon="search" />
    </BlueprintSelect>;
  }  
}


class Role {
  static Label = Label;
  static List = List;
  static Select = connect(null, {suggestRoles})(injectIntl(Select));;
}

export default Role;
