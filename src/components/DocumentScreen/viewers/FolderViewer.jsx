import React, { Component } from 'react';
import { connect } from 'react-refetch';
import { Link } from 'react-router-dom';

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
  render() {
    const { document, result } = this.props;
    return (
      <div className="FolderViewer">
        {result.pending && 'loading..'}
        {result.rejected && <span>Error: {JSON.stringify(result.meta)}</span>}
        <ul>
          {result.fulfilled && result.value.results.map(childDoc => (
            <DocAsListItem key={childDoc.id} document={childDoc} />
          ))}
        </ul>
      </div>
    );
  }
}

export default connect(props => ({
  result: `//localhost:5000/api/2/documents?filter%3Aparent.id=${props.document.id}`,
}))(FolderViewer);
