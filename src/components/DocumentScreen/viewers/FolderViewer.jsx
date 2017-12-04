import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { fetchChildDocs } from 'src/actions';

function getPath(url) {
  return new URL(url).pathname;
}

class DocAsListItem extends Component {
  render() {
    const { document } = this.props;
    return (
      <li>
        <Link to={getPath(document.ui)}>
          {document.file_name}
        </Link>
      </li>
    )
  }
}

class FolderViewer extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { document, childDocs } = this.props;
    if (childDocs === undefined) {
      this.props.fetchChildDocs(document.id);
    }
  }

  render() {
    const { childDocs } = this.props;
    return (
      <div className="FolderViewer">
        <ul>
          {childDocs && childDocs.map(childDoc => (
            <DocAsListItem key={childDoc.id} document={childDoc} />
          ))}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { childDocIdsResult } = ownProps.document;
  const childDocs = childDocIdsResult !== undefined
    ? childDocIdsResult.results.map(id => state.documentCache[id])
    : undefined;
  return {
    childDocs,
  };
};

export default connect(mapStateToProps, { fetchChildDocs })(FolderViewer);
