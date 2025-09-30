import React, { useCallback, useEffect, useRef, useState } from "react";
import { Page, useNavigate, Header, useLocation, Box, Button } from "zmp-ui";
import "@iproov/web-sdk";
import {
  initTransactionApi,
  verifyFaceDynamicFlashApi,
  InitTransactionData,
} from "@ekyc-zma-sdk/liveness";
import RoutePath from "@/constants/route-path";
import introLiveness from "@/assets/intro-liveness.svg";
import introLiveness1 from "@/assets/intro-liveness-1.svg";
import introLiveness2 from "@/assets/intro-liveness-2.svg";
import introLiveness3 from "@/assets/intro-liveness-3.svg";
import FailedView from "../result/failed-view";

const IproovPage: React.FunctionComponent = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [transactionData, setTransactionData] = useState<InitTransactionData>();
  const iproovContainerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const { verifyToken: token, transactionId } = { ...transactionData };
  const { request_id: clientTransactionId, data: idCardInfo } = state;
  useEffect(() => {
    // Kiểm tra xem Web Components đã sẵn sàng chưa
    if (window.customElements.get("iproov-me")) {
      setReady(true);
    }

    const handleReady = () => {
      setReady(true);
    };

    window.addEventListener("WebComponentsReady", handleReady);

    return () => {
      window.removeEventListener("WebComponentsReady", handleReady);
    };
  }, []);
  const initLiveness = useCallback(async () => {
    setError(undefined);
    setTransactionData(undefined);
    const res = await initTransactionApi({
      withToken: true,
      clientTransactionId: clientTransactionId,
    });
    if (typeof res.data === "object" && res.data !== null) {
      const transactionData = res.data as {
        transactionId: string;
        verifyToken: string;
      };
      setTransactionData(transactionData);
    }
  }, []);

  useEffect(() => {
    initLiveness();
  }, []);

  useEffect(() => {
    if (!ready || !iproovContainerRef.current) return;

    const iproovElement = iproovContainerRef.current.querySelector("iproov-me");

    if (!iproovElement) return;

    const handlePassed = (event: any) => {
      const verifyFace = async () => {
        if (transactionId) {
          const res = await verifyFaceDynamicFlashApi({
            transaction_id: transactionId,
          });
          const success = res.success && res.data.success;
          if (success) {
            navigate(RoutePath.identificationInfo, {
              state: {
                idCardInfo,
              },
            });
          } else {
            navigate(RoutePath.result, {
              state: {
                success,
                idCardInfo,
              },
            });
          }
        }
      };
      verifyFace();
    };

    const handleError = (event: any) => {
      setError(`${event.detail?.feedback} - ${event.detail?.reason}`);
    };

    iproovElement.addEventListener("passed", handlePassed);
    iproovElement.addEventListener("error", handleError);
    iproovElement.addEventListener("failed", handleError);

    return () => {
      iproovElement.removeEventListener("passed", handlePassed);
      iproovElement.removeEventListener("error", handleError);
      iproovElement.removeEventListener("failed", handleError);
    };
  }, [ready, token]);

  return (
    <Page className="">
      <Header title="Quay video chân dung" />
      <Box>
        {token && token.length > 0 && (
          <div className="mt-8 p-4" ref={iproovContainerRef}>
            <iproov-me token={token} base_url="https://sg.rp.secure.iproov.me">
              <div slot="failed">
                <FailedView
                  title="Đăng ký không thành công"
                  message={error}
                  onClose={() => navigate(RoutePath.home, { replace: true })}
                  onTryAgain={initLiveness}
                />
              </div>

              <div slot="error">
                <FailedView
                  title="Đăng ký không thành công"
                  message={error}
                  onClose={() => navigate(RoutePath.home, { replace: true })}
                  onTryAgain={initLiveness}
                />
              </div>

              <div slot="canceled">
                <FailedView
                  title="Đăng ký không thành công"
                  message={error}
                  onClose={() => navigate(RoutePath.home, { replace: true })}
                  onTryAgain={initLiveness}
                />
              </div>

              <div slot="passed">
                <div></div>
              </div>

              <div slot="ready">
                <div className="flex flex-col items-center">
                  <img src={introLiveness} />
                  <div className="flex flex-col bg-white rounded-xl p-4 space-y-4 shadow-md">
                    <div className="flex flex-row w-full items-center space-x-2">
                      <img src={introLiveness1} />
                      <div className="text-sm text-neutral-900 text-wrap">
                        Hình ảnh đủ ánh sáng, không bị mờ và lóa
                      </div>
                    </div>
                    <div className="flex flex-row w-full items-center space-x-2">
                      <img src={introLiveness2} />
                      <div className="text-sm text-neutral-900 text-wrap">
                        Không đeo kính và đội mũ
                      </div>
                    </div>
                    <div className="flex flex-row w-full items-center space-x-2">
                      <img src={introLiveness3} />
                      <div className="text-sm text-neutral-900 text-wrap">
                        Không đeo khẩu trang hoặc che khuôn mặt
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div slot="button" className="mt-20">
                <Button
                  variant="primary"
                  className="rounded-lg p-3 w-full font-semibold text-sm"
                >
                  Bắt đầu quay video
                </Button>
              </div>
            </iproov-me>
          </div>
        )}
      </Box>
    </Page>
  );
};

export default IproovPage;
