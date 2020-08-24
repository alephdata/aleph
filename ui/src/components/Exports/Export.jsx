import React, { PureComponent } from "react";
import { selectUnit } from "@formatjs/intl-utils";
import { FormattedRelativeTime } from "react-intl";
import c from 'classnames';

import { Skeleton, ExportLink, FileSize } from "src/components/common";

import "./Export.scss";

class Export extends PureComponent {
  renderSkeleton = () => (
    <tr className="Export nowrap">
      <td className="export-label wide">
        <Skeleton.Text type="span" length={15} />
      </td>
      <td className="export-filesize">
        <Skeleton.Text type="span" length={5} />
      </td>
      <td className="export-status">
        <Skeleton.Text type="span" length={5} />
      </td>
      <td className="timestamp">
        <Skeleton.Text type="span" length={15} />
      </td>
    </tr>
  );

  convertUTCDateToLocalDate = (date) => {
    const newDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60 * 1000
    );
    const offset = date.getTimezoneOffset() / 60;
    const hours = date.getHours();
    newDate.setHours(hours - offset);
    return newDate;
  };

  render() {
    const { isPending, export_ } = this.props;

    if (isPending) {
      return this.renderSkeleton();
    }

    const { id, expires_at: expiresAt, export_status: status } = export_;

    const expiryDate = this.convertUTCDateToLocalDate(new Date(expiresAt));
    const { value, unit } = selectUnit(expiryDate);
    return (
      <tr key={id} className={c("Export nowrap", status)}>
        <td className="export-label wide">
          <ExportLink export_={export_} icon="package" />
        </td>
        <td className="export-filesize">
          <FileSize value={export_.file_size} />
        </td>
        <td className="export-status">{export_.export_status}</td>
        <td className="timestamp">
          <FormattedRelativeTime
            value={value}
            unit={unit}
            // eslint-disable-next-line
            style="long"
            numeric="auto"
          />
        </td>
      </tr>
    );
  }
}

export default Export;
