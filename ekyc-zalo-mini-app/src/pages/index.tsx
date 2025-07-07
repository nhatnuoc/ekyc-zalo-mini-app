import { Button, Header, Page, Sheet, useNavigate } from "zmp-ui";
import imgSecurity from '@/assets/img_security.svg'
import icCamera from '@/assets/camera.svg'
import icCardID from '@/assets/Card ID.svg'
import icNfc from '@/assets/NFC.svg'
import statusInfo from '@/assets/status-info.svg'
import statusError from '@/assets/status-error.svg'
import RoutePath from "@/constants/route-path";

function HomePage() {
  const navigate = useNavigate()
  return (
    <Page
      className="flex flex-col bg-cover bg-center bg-no-repeat bg-neutral-100 dark:bg-neutral-100"
      // style={{
      //   backgroundImage: `url(${bg})`,
      // }}
      title="Định danh trực tuyến"
    >
      <Header title="Định danh trực tuyến" showBackIcon={false}/>
      <div className="flex flex-col bg-white mx-4 mt-16 p-4 rounded-xl">
        <img src={imgSecurity}/>
        <div className="text-center font-bold text-xl text-neutral-900">Định danh</div>
        <div className="text-center text-sm text-neutral-900">Bạn hãy định danh để thực hiện mở tài khoản giao dịch trực tuyến</div>
      </div>
      <div className="text-neutral-700 ml-4 mb-2 mt-6 font-semibold text-sm">Bạn cần chuẩn bị</div>
      <div className="flex flex-col bg-white mx-4 p-4 rounded-xl">
        <div className="flex flex-row w-full">
          <img src={icCardID}/>
          <span className="ml-2 text-neutral-900">CCCD gắn chip của chính bạn</span>
        </div>
        <div className="flex flex-row w-full my-2">
          <img src={icNfc}/>
          <span className="ml-2 text-neutral-900">Thiết bị có tính năng đọc NFC</span>
        </div>
        <div className="flex flex-row w-full items-start">
          <img src={icCamera}/>
          <span className="ml-2 text-neutral-900">Cho phép ứng dụng Zalo miniApp truy cập camera</span>
        </div>
      </div>
      <Button variant="primary" className="font-semibold text-sm m-4 bg-primary text-neutral-900" onClick={() => {
        navigate(RoutePath.scanMrz)
        }}>Cập nhật ngay</Button>
      <Sheet visible={false} onClose={() => {}} width={300}>
        <div className="flex flex-col items-center mx-4">
          <img src={statusError} className="w-1/6"/>
          <div className="text-base font-semibold my-2">
            Thiết bị không hỗ trợ NFC
          </div>
          <div>
            Thiết bị của Quý khách không hỗ trợ NFC. Vui lòng sử dụng thiết bị khác để đăng ký.
          </div>
          <Button variant="primary" fullWidth className="font-semibold text-sm mx-4 bg-primary text-neutral-900" onClick={() => {
            
          }}>Đóng</Button>
        </div>
      </Sheet>
    </Page>
  );
}

export default HomePage;