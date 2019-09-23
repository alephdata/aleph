import React, { PureComponent, Component } from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import {
  Button, MenuItem, Classes, Alignment, Icon,
} from '@blueprintjs/core';
import { Select as BlueprintSelect } from '@blueprintjs/select';

import wordList from 'src/util/wordList';
import { suggestRoles } from 'src/actions';

import './Role.scss';

const messages = defineMessages({
  label: {
    id: 'role.select.user',
    defaultMessage: 'Choose a user',
  },
});


class RoleLabel extends Component {
  shouldComponentUpdate(nextProps) {
    const { role } = this.props;
    return role.id !== nextProps.role.id;
  }

  render() {
    const { role, icon = true, long = false } = this.props;
    if (!role) {
      return null;
    }
    const iconName = role.type === 'user' ? 'user' : 'shield';
    return (
      <span className="Role">
        { icon && <Icon icon={iconName} /> }
        { long ? role.label : role.name }
      </span>
    );
  }
}


class RoleLink extends PureComponent {
  render() {
    const { role } = this.props;
    if (!role) {
      return null;
    }
    if (role.type === 'group') {
      return (
        <Link to={`/groups/${role.id}`}>
          <RoleLabel {...this.props} />
        </Link>
      );
    }
    return <RoleLabel {...this.props} />;
  }
}


class RoleList extends PureComponent {
  render() {
    const { roles, truncate = Infinity } = this.props;
    if (!roles) return null;

    let names = roles.map(role => <RoleLink key={role.id} role={role} {...this.props} />);

    // Truncate if too long
    if (names.length > truncate) {
      names = [...names.slice(0, truncate), '…'];
    }
    return wordList(names, ' · ');
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
      suggested: roles.results,
    });
  }

  onSelectRole(role, event) {
    event.stopPropagation();
    this.props.onSelect(role);
  }

  renderRole = (role, { handleClick, modifiers }) => (
    <MenuItem
      className={modifiers.active ? Classes.ACTIVE : ''}
      key={role.id}
      onClick={handleClick}
      text={role.label}
    />
  )

  render() {
    const { intl, role } = this.props;
    const { suggested } = this.state;
    const label = role ? role.label : intl.formatMessage(messages.label);
    return (
      <BlueprintSelect
        itemRenderer={this.renderRole}
        items={suggested}
        onItemSelect={this.onSelectRole}
        onQueryChange={this.onSuggest}
        popoverProps={{
          minimal: true,
          fill: true,
          // position: Position.BOTTOM_LEFT,
        }}
        inputProps={{
          fill: true,
        }}
        filterable
        resetOnQuery
        resetOnClose
        resetOnSelect
      >
        <Button
          fill
          text={label}
          icon="user"
          rightIcon="search"
          alignText={Alignment.LEFT}
        />
      </BlueprintSelect>
    );
  }
}

class Role {
  static Label = RoleLabel;

  static Link = RoleLink;

  static List = RoleList;

  static Select = connect(null, { suggestRoles })(injectIntl(Select));;
}

export default Role;
