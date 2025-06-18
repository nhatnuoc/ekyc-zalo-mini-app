import React, { useState } from "react";
import { Page, Header } from "zmp-ui";
import MRZScanner from "./mrz-scanner";

const ReadCardPage: React.FunctionComponent = (props) => {
  return (
    <Page className="page">
      <Header title="Đọc CCCD"/>
      <div>
          <MRZScanner />
      </div>
    </Page>
  );
};

export default ReadCardPage;
