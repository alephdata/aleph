import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Icon } from "@blueprintjs/core";
import Truncate from 'react-truncate';

import { Date, Role, Category, Country, Collection } from 'src/components/common';
import CollectionDeleteDialog from 'src/dialogs/CollectionDeleteDialog/CollectionDeleteDialog';

import './CollectionListItem.css';

class CollectionListItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deleteIsOpen: false
    };
    this.toggleDelete = this.toggleDelete.bind(this);
  }

  toggleDelete() {
    this.setState({deleteIsOpen: !this.state.deleteIsOpen});
  }

  render() {
    const { collection, preview = true } = this.props;
    if (!collection || !collection.id) {
      return null;
    }
    return (
      <li className="CollectionListItem" key={collection.id}>
        <h4>
          <span className="pt-tag pt-small pt-round pt-intent-primary">
            <FormattedNumber value={collection.count} />
          </span>
          <Collection.Link preview={preview} collection={collection} icon />
        </h4>
        {collection.summary &&
          <p className="summary">
            <Truncate lines={2} title={collection.summary}>
              { collection.summary }
            </Truncate>
          </p>
        }
        <p className="details">
          { !collection.casefile && (
            <span className="details-item">
              <Icon icon="list" />
              <Category collection={collection} />
            </span>
          )}

          <span className="details-item">
            <Icon icon="time" />
            <FormattedMessage id="collection.last_updated"
                              defaultMessage="Updated {date}"
                              values={{
                                date: <Date value={collection.updated_at} />
                              }}/>
          </span>
          
          { collection.countries.length > 0 && (
            <span className="details-item">
              <Icon icon="globe" />
              <Country.List codes={collection.countries} truncate={3} />
            </span>
          )}

          { collection.casefile && (
            <span className="details-item">
              <Icon icon="social-media" />
              <Role.List roles={collection.team} icon={false} truncate={3} />
            </span>
          )}
          
          { collection.casefile && (
            <span className="delete-item">
              <a onClick={this.toggleDelete}>
                <Icon icon="trash" />
              </a>
              <CollectionDeleteDialog collection={collection}
                                      isOpen={this.state.deleteIsOpen}
                                      toggleDialog={this.toggleDelete} />
            </span>
          )}

        </p>
      </li>
    );
  }
}

export default CollectionListItem;
