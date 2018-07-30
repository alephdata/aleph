import React, { Component } from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { Icon } from "@blueprintjs/core";
import Truncate from 'react-truncate';

import { Date, Collection, Role, Country } from 'src/components/common';
import CollectionDeleteDialog from 'src/dialogs/CollectionDeleteDialog/CollectionDeleteDialog';

import '../Collection/CollectionListItem.css';
import './CaseListItem.css';

class CaseListItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deleteIsOpen: false
    };
    this.toggleDeleteCase = this.toggleDeleteCase.bind(this);
  }

  toggleDeleteCase() {
    this.setState({deleteIsOpen: !this.state.deleteIsOpen});
  }

  render() {
    const { collection } = this.props;
    if (!collection || !collection.id) {
      return null;
    }

    return (
      <div className="CaseListItem" key={collection.id}>
        <h4>
          <span className="pt-tag pt-small pt-round pt-intent-primary">
            <FormattedNumber value={collection.count} />
          </span>
          <Collection.Link collection={collection} />
        </h4>
        {collection.summary &&
        <p className="summary">
          <Truncate lines={2} title={collection.summary}>
            { collection.summary }
          </Truncate>
        </p>
        }
        <p className="details">

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
              <Country.List codes={collection.countries} truncate={4} />
            </span>
          )}
            <span className="details-item">
              <Icon icon="social-media" />
              <Role.List roles={collection.team} icon={false} />
            </span>
          <span className="delete-item">
              <a onClick={this.toggleDeleteCase}>
              <Icon icon="trash" />
            </a>
             <CollectionDeleteDialog collection={collection}
                                     isOpen={this.state.deleteIsOpen}
                                     toggleDialog={this.toggleDeleteCase} />
            </span>
        </p>
      </div>
    );
  }
}

export default CaseListItem;
