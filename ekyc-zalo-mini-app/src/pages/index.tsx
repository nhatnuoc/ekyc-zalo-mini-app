import {
  Button,
  Checkbox,
  Header,
  Page,
  Sheet,
  useNavigate,
} from "zmp-ui";
import imgSecurity from "@/assets/img_security.svg";
import icCamera from "@/assets/camera.svg";
import icCardID from "@/assets/Card ID.svg";
import icNfc from "@/assets/NFC.svg";
import statusError from "@/assets/status-error.svg";
import RoutePath from "@/constants/route-path";
import { useAppStore } from "@/store";

function HomePage() {
  const navigate = useNavigate();
  const { agentName, appLogo } = useAppStore();
  return (
    <Page
      className="flex flex-col bg-cover bg-center bg-no-repeat"
      // style={{
      //   backgroundImage: `url(${bg})`,
      // }}
      title="Định danh trực tuyến"
    >
      <Header title="Định danh trực tuyến" showBackIcon={false} />
      <div className="flex flex-col h-full">
        <div className="overflow-y-auto">
          <div className="flex flex-col bg-white mx-4 mt-16 p-4 rounded-xl">
            <div className="flex justify-center">
              <img src={appLogo} className="max-h-20" />
            </div>
            <img src={imgSecurity} />
            <div className="text-center font-bold text-xl text-neutral-900">
              Định danh
            </div>
            <div className="text-center text-sm text-neutral-900">
              Bạn hãy định danh để thực hiện mở tài khoản giao dịch trực tuyến
            </div>
          </div>
          <div className="text-neutral-700 ml-4 mb-2 mt-6 font-semibold text-sm">
            Bạn cần chuẩn bị
          </div>
          <div className="flex flex-col bg-white mx-4 p-4 rounded-xl">
            <div className="flex flex-row w-full">
              <img src={icCardID} />
              <span className="ml-2 text-neutral-900">
                CCCD gắn chip của chính bạn
              </span>
            </div>
            <div className="flex flex-row w-full my-2">
              <img src={icNfc} />
              <span className="ml-2 text-neutral-900">
                Thiết bị có tính năng đọc NFC
              </span>
            </div>
            <div className="flex flex-row w-full items-start">
              <img src={icCamera} />
              <span className="ml-2 text-neutral-900">
                Cho phép ứng dụng Zalo miniApp truy cập camera
              </span>
            </div>
          </div>
          <div className="text-neutral-700 ml-4 mb-2 mt-6 font-semibold text-sm">
            Điều khoản điều kiện
          </div>
          <div className="flex flex-col bg-white mx-4 p-4 rounded-xl">
            <div className="flex flex-row w-full">
              <Checkbox
                label={`Tôi đồng ý chia sẻ thông tin cá nhân để ${agentName} thực hiện định danh và cung cấp dịch vụ.`}
                defaultChecked
                value={0}
                className="text-neutral-900"
                size="small"
              />
            </div>
            <div className="flex flex-row w-full my-2">
              <Checkbox
                label={`Tôi đồng ý cho ${agentName} chia sẻ thông tin và kết quả định danh với các nhà cung cấp dịch vụ tôi chọn trên ứng dụng này.`}
                defaultChecked
                value={0}
                className="text-neutral-900"
                size="small"
              />
            </div>
          </div>

          <Sheet visible={false} onClose={() => {}} width={300}>
            <div className="flex flex-col items-center mx-4">
              <img src={statusError} className="w-1/6" />
              <div className="text-base font-semibold my-2">
                Thiết bị không hỗ trợ NFC
              </div>
              <div>
                Thiết bị của Quý khách không hỗ trợ NFC. Vui lòng sử dụng thiết
                bị khác để đăng ký.
              </div>
              <Button
                variant="primary"
                fullWidth
                className="font-semibold text-sm mx-4"
                onClick={() => {}}
              >
                Đóng
              </Button>
            </div>
          </Sheet>
        </div>
        <Button
          variant="primary"
          className="font-semibold text-sm m-4 flex-none"
          onClick={() => {
            navigate(RoutePath.scanMrz);
          }}
        >
          Cập nhật ngay
        </Button>
      </div>
    </Page>
  );
}

export default HomePage;
