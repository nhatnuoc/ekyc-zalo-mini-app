import React, { useState } from "react";
import { Page, Header } from "zmp-ui";
import MRZScanner from "./mrz-scanner";

const ScanMrzPage: React.FunctionComponent = (props) => {
  return (
    <Page className="page bg-neutral-100 dark:bg-neutral-100">
      <Header title="Nhập thông tin CCCD"/>
      <div>
          <MRZScanner />
      </div>
    </Page>
  );
};

export default ScanMrzPage;