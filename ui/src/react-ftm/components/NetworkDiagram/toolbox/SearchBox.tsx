import * as React from 'react';
import { Button, InputGroup } from '@blueprintjs/core';
import c from 'classnames';

import './SearchBox.scss';

interface ISearchBoxProps {
  onChangeSearch: (searchText: string) => void;
  onSubmitSearch: (event: React.FormEvent) => void;
  searchText: string;
}

interface ISearchBoxState {
  mobileExpanded: boolean;
}

export class SearchBox extends React.Component<
  ISearchBoxProps,
  ISearchBoxState
> {
  state: ISearchBoxState = {
    mobileExpanded: false,
  };

  constructor(props: Readonly<ISearchBoxProps>) {
    super(props);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.toggleMobileExpanded = this.toggleMobileExpanded.bind(this);
  }

  onChangeSearch(event: React.FormEvent<HTMLInputElement>) {
    const searchText = event.currentTarget.value.trim();
    this.props.onChangeSearch(searchText);
  }

  toggleMobileExpanded() {
    this.setState(({ mobileExpanded }) => ({
      mobileExpanded: !mobileExpanded,
    }));
  }

  render() {
    const { onSubmitSearch, searchText } = this.props;
    const { mobileExpanded } = this.state;
    return (
      <div className="SearchBox">
        <div className={c('SearchBox__input', { expanded: mobileExpanded })}>
          <form onSubmit={onSubmitSearch}>
            <InputGroup
              leftIcon="search"
              onChange={this.onChangeSearch}
              value={searchText}
            />
          </form>
        </div>
        <Button
          icon={mobileExpanded ? 'cross' : 'search'}
          className="SearchBox__mobile-toggle"
          onClick={this.toggleMobileExpanded}
        />
      </div>
    );
  }
}
