import React, { useCallback, useEffect, useRef, useState } from "react";
import { Page, useNavigate, Header, useLocation, Box, Button } from "zmp-ui";
import "@iproov/web-sdk"
import { initTransactionApi, verifyFaceApi } from "./api";
import { InitTransactionData } from "./models";

const IproovPage: React.FunctionComponent = () => {
  const { state: { clientTransactionId } } = useLocation()
  const [transactionData, setTransactionData] = useState<InitTransactionData>()
  const iproovContainerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>()
  const { verifyToken: token, transactionId } = {...transactionData}

  useEffect(() => {
    console.log('Checking Web Components status...');
    
    // Kiểm tra xem Web Components đã sẵn sàng chưa
    if (window.customElements.get('iproov-me')) {
      console.log('iproov-me element is already defined');
      setReady(true);
    }

    const handleReady = () => {
      console.log('WebComponentsReady event fired');
      setReady(true);
    };

    window.addEventListener("WebComponentsReady", handleReady);

    return () => {
      window.removeEventListener("WebComponentsReady", handleReady);
    };
  }, []);
  const initLiveness = useCallback(async () => {
    console.log("client transaction id: ", clientTransactionId)
    setError(undefined)
    setTransactionData(undefined)
    const res = await initTransactionApi({ withToken: true, clientTransactionId: clientTransactionId })
    if (typeof res.data === "object" && res.data !== null) {
      const transactionData = res.data as { transactionId: string; verifyToken: string };
      setTransactionData(transactionData)
    }
  }, [])

  useEffect(() => {
    initLiveness()
    window.addEventListener('passed', (e) => {
      console.log("passed")
    })
  }, [])

  useEffect(() => {
    console.log('Effect triggered - ready:', ready, 'container:', iproovContainerRef.current);
    if (!ready || !iproovContainerRef.current) return;

    const iproovElement = iproovContainerRef.current.querySelector('iproov-me');
    console.log('Found iproov element:', iproovElement);
    
    if (!iproovElement) return;

    const handlePassed = (event: any) => {
      console.log("✅ Liveness completed, call validate API here");
      const verifyFace = async () => {
        if (transactionId) {
          const res = await verifyFaceApi({
            transaction_id: transactionId
          })
          console.log("liveness result: ", res)
        }
      }
      verifyFace()
    };

    const handleError = (event: any) => {
      console.error("❌ Error:", event.detail?.feedback);
      setError(`${event.detail?.feedback} - ${event.detail?.reason}`)
    };

    iproovElement.addEventListener("passed", handlePassed);
    iproovElement.addEventListener("error", handleError);
    iproovElement.addEventListener("failed", handleError);

    return () => {
      iproovElement.removeEventListener("passed", handlePassed);
      iproovElement.removeEventListener("error", handleError);
      iproovElement.removeEventListener("failed", handleError);
    };
  }, [ready, token])

  return (
    <Page className="page" >
      <Header title="Liveness"/>
      <Box>
        {token && token.length > 0 && (
          <div className="mt-8" ref={iproovContainerRef}>
            <iproov-me 
              token={token} 
              base_url="https://sg.rp.secure.iproov.me"
            >
              <div slot="failed">
                <p>{error}</p>
                <Button onClick={initLiveness}>Try again</Button>
              </div>
              <div slot="error">
                <p>{error}</p>
                <Button onClick={initLiveness}>Try again</Button>
              </div>
            </iproov-me>
            
          </div>
        )}
      </Box>
    </Page>
  );
};

export default IproovPage;