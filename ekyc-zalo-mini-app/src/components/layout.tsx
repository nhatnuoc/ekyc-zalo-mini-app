import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";

import HomePage from "@/pages/index";
import ReadCardPage from "@/pages/read-card";
import IproovPage from "@/pages/iproov";
import ScanMrzPage from "@/pages/scan-mrz";
import RoutePath from "@/constants/route-path";
import EkycResultPage from "@/pages/result";
import IdentificationInfoPage from "@/pages/identification-info";
import { useEffect } from "react";
import { config as configReadCard } from "@ekyc-zma-sdk/read-card";
import { config as configLiveness } from "@ekyc-zma-sdk/liveness";
import { appId, faceUrl, ekycUrl, privateKey, publicKey, agentCode } from "@/constants";

const Layout = () => {
  useEffect(() => {
    configReadCard({
      appId,
      baseUrl: ekycUrl,
      publicKey,
      privateKey,
      agentCode: agentCode,
    });
    configLiveness({
      appId,
      baseUrl: faceUrl,
      publicKey,
      privateKey,
      agentCode: agentCode,
    });
  });
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            <Route path={RoutePath.home} element={<HomePage />}></Route>
            <Route path={RoutePath.readCard} element={<ReadCardPage />}></Route>
            <Route path={RoutePath.iproov} element={<IproovPage />}></Route>
            <Route path={RoutePath.scanMrz} element={<ScanMrzPage />}></Route>
            <Route path={RoutePath.result} element={<EkycResultPage />}></Route>
            <Route
              path={RoutePath.identificationInfo}
              element={<IdentificationInfoPage />}
            ></Route>
          </AnimationRoutes>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};
export default Layout;
