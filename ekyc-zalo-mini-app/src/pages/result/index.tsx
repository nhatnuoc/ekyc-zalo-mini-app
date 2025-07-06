import React, { useCallback } from "react";
import { Page, useLocation, useNavigate } from "zmp-ui";
import SuccessView from "./success-view";
import RoutePath from "@/constants/route-path";
import FailedView from "./failed-view";

const EkycResultPage: React.FunctionComponent = ({
  
}: {
  
}) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { success, idCardInfo } = state
  const goHome = useCallback(() => {
    navigate(RoutePath.home, { replace: true })
  }, [])
  const goIdCardInfo = useCallback(() => {
    navigate(RoutePath.identificationInfo, { replace: true, state: { idCardInfo } })
  }, [])
  return (
    <Page className="page bg-neutral-100 dark:bg-neutral-100">
      <div className="bg-white mt-20">
          {
            success ? 
            <SuccessView onComplete={goHome}/> 
            :
            <FailedView onClose={goHome} onTryAgain={goHome}/>
          }
      </div>
    </Page>
  );
};

export default EkycResultPage;