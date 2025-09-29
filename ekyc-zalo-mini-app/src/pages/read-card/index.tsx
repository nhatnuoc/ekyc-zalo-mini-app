import React, { useCallback, useEffect, useState } from "react";
import { scanNFC, showToast } from "zmp-sdk";
import { Page, Header, Swiper, Button, useLocation, useNavigate } from "zmp-ui";
import { initTransaction, readCard, registerDeviceToken } from '@ekyc-zma-sdk/read-card';
import RoutePath from "@/constants/route-path";

const IntroStepComponent = ({
  title, image
}: {
  title: string;
  image: string;
}) => (
  <div>
    <div className="font-medium text-base text-wrap">
      {title}
    </div>
    <img src={image}/>
  </div>
)

const ReadCardPage: React.FunctionComponent = (props) => {
  const { state: { mrz }} = useLocation()
  const navigate = useNavigate()
  const [isLoading, setLoading] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const startScanNFC = useCallback(() => {
    setLoading(true)
    scanNFC({
        type: 'cccd',
        data: {
            mrz: mrz
        }
    })
    .then(value => {
      const {sod, dg1, dg2, dg13, dg14} = value
      return registerDeviceToken({
        deviceId: "82gg22da-258c-4155-815c-0a1af073bf4b",
        deviceName: "iPhone 14 Pro Max",
        deviceOs: "iOS 16.2.9",
        period: 6000,
        secret: "HVR4CFHAFOWFGGFC"
      })
      .then(res => {
        return initTransaction()
      })
      .then(res => {
        return readCard({ sod, dg1DataB64: dg1, dg2DataB64: dg2, dg13DataB64: dg13, dg14DataB64: dg14, transactionId: res.data })
      })
      .then(res => {
        setLoading(false)
        const nfcData = res
        navigate(RoutePath.iproov, { state: nfcData })
      })
    })
    .catch(error => {
      setLoading(false)
      showToast({ message: `Lỗi: ${error}` })
    })
  }, [])
  useEffect(() => {
    setTimeout(() => {
      setAutoPlay(true)
    }, 3000)
  }, [])
  return (
    <Page className="page bg-neutral-100 dark:bg-neutral-100">
      <Header title="Quét căn cước công dân" style={{ fontSize: '1rem', fontWeight: '600' }}/>
      <div className="flex flex-col mt-10">
        <div>
          <Swiper autoplay={autoPlay} loop dots={false} duration={3000}>
            <Swiper.Slide>
              <IntroStepComponent 
                title="Bước 1: Đặt MẶT SAU của điện thoại tiếp xúc với chip của CCCD như hình hướng dẫn"
                image={"https://cdn.jsdelivr.net/gh/nhatnuoc/orcb-traineddata@main/intro-readcard-1.svg"}
              />
            </Swiper.Slide>
            <Swiper.Slide>
              <IntroStepComponent 
                title="Bước 2: Giữ CCCD cố định cho đến khi hoàn tất."
                image={"https://cdn.jsdelivr.net/gh/nhatnuoc/orcb-traineddata@main/intro-readcard-2.svg"}
              />
            </Swiper.Slide>
            <Swiper.Slide>
              <IntroStepComponent 
                title="Bước 2: Giữ CCCD cố định cho đến khi hoàn tất."
                image={"https://cdn.jsdelivr.net/gh/nhatnuoc/orcb-traineddata@main/intro-readcard-3.svg"}
              />
            </Swiper.Slide>
          </Swiper>
        </div>
        <Button onClick={() => {
          startScanNFC()
        }} variant="primary" loading={isLoading}>
          Bắt đầu
        </Button>
      </div>
    </Page>
  );
};

export default ReadCardPage;