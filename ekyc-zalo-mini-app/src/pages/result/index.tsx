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
  const { success } = state
  const goHome = useCallback(() => {
    navigate(RoutePath.home, { replace: true })
  }, [])
  return (
    <Page className="">
      <div className="bg-white mt-20 p-4">
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