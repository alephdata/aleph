import React from 'react';
import { connect } from 'react-redux';
import { FormattedNumber } from 'react-intl';
import { Link } from 'react-router-dom';

import { Property, Schema } from 'src/components/common';
import queryString from "query-string";
import { EntityInfoTags } from 'src/components/Entity';
import getPath from "../../util/getPath";

class EntityConnections extends React.Component {
    constructor(props) {
        super(props);
        this.referenceLink = this.referenceLink.bind(this);
    }

    referenceLink(reference) {
        const { entity } = this.props;
        const path = getPath(entity.links.ui);
        const tabName = 'references-' + reference.property.qname;
        const query = queryString.stringify({'content:tab': tabName});
        return path + '#' + query;
    }

    render() {
        const { connectionsTotal, references, entity } = this.props;

        return (
            <React.Fragment>
                {connectionsTotal && connectionsTotal > 0 && (
                    <div>
                        <span className="relationship">
                            Relationships
                          </span>
                        <ul className="info-rank">
                            { references.results.map((ref) => (
                                <li key={ref.property.qname}>
                            <span className="key">
                              <Schema.Icon schema={ref.schema} />{' '}
                                <Link to={this.referenceLink(ref)}>
                                <Property.Reverse model={ref.property} />
                              </Link>
                            </span>
                                    <span className="value">
                              <FormattedNumber value={ref.count} />
                            </span>
                                </li>
                            ))}
                        </ul>
                        <EntityInfoTags entity={entity} />
                    </div>
                )}
                {connectionsTotal === 0 && <ul/>}
            </React.Fragment>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {};
};

export default connect(mapStateToProps, {})(EntityConnections)