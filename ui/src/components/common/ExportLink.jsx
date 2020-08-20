import React, { PureComponent } from "react";
import { Icon } from "@blueprintjs/core";

import "./ExportLink.scss";

class ExportLink extends PureComponent {
  render() {
    const { export_ } = this.props;
    const exportSuccess = "successful";
    if (export_.export_status === exportSuccess) {
      return (
        <span className="ExportLink">
          <a href={export_.links.download}>
            <Icon icon={"package"} />
            {export_.label}
          </a>
        </span>
      );
    } else {
      return (
        <span className="ExportLink">
          <Icon icon={"package"} />
          {export_.label}
        </span>
      );
    }
  }
}

export default ExportLink;
