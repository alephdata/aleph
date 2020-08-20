import React, { PureComponent } from "react";
import { Icon } from "@blueprintjs/core";

import "./ExportLink.scss";

class ExportLink extends PureComponent {
  render() {
    const { export_ } = this.props;
    return (
      <span className="ExportLink">
        <a href={export_.links.download}>
          <Icon icon={"package"} />
          {export_.label}
        </a>
      </span>
    );
  }
}

export default ExportLink;
