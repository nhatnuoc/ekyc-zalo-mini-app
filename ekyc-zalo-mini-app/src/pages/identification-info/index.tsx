import React, { useState } from "react";
import { Page, Header, Grid, useLocation, Button, useNavigate } from "zmp-ui";
import logoCA from '@/assets/logo-ca.svg'
import bgIdCard from '@/assets/bg-id-card.svg'
import RoutePath from "@/constants/route-path";

const IdentificationInfoPage: React.FunctionComponent = (props) => {
  const { state: { idCardInfo }} = useLocation()
  const navigate = useNavigate()
  return (
    <Page className="page bg-neutral-100 dark:bg-neutral-100">
      <Header title="Thông tin định danh"/>
      {/* <div className="absolute flex items-center justify-center w-full h-full">
        <img src={logoCA} />
      </div> */}
      <div className="mt-10 w-full h-full">
      {
        idCardInfo && <div className="rounded-2xl flex flex-col bg-[#ffffff] overflow-hidden shadow-md">
          <div className="bg-[#12702E]">
            <div className="flex flex-col px-4 pt-4 pb-2 bg-contain bg-no-repeat" style={{ backgroundImage: `url(${bgIdCard})` }}>
              <img 
                className="w-1/4"
                src={`data:image/jpeg;base64,${idCardInfo?.face_image}`} 
                alt="Ảnh chân dung" 
                style={{ 
                  maxWidth: '200px', 
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }} 
              />
              <div className="text-white font-semibold text-base mt-2">
                {
                  idCardInfo?.full_name
                }
              </div>
              <div className="text-[#ffffffaa] text-sm mt-2">
                Số CCCD: 
                {
                  idCardInfo?.citizen_identify
                }
              </div>
            </div>
            <div className="bg-[#158336] px-4 py-2 text-[#FFD143] text-sm">
              Xác thực bởi Bộ Công an
            </div>
          </div>
          <div className="positive h-full w-full flex flex-col m-4 bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoCA})` }}>
            <Grid columnCount={2} columnSpace='1rem' rowSpace='1rem' className="w-full">
              {/* <div>Số CCCD</div>
              <div>{idCardInfo?.citizen_identify}</div>
              <div>Tên</div>
              <div>{idCardInfo?.full_name}</div> */}
              <div>Ngày sinh</div>
              <div>{idCardInfo?.date_of_birth}</div>
              <div>Ngày hết hạn</div>
              <div>{idCardInfo?.date_of_expiry}</div>
              <div>Ngày cấp</div>
              <div>{idCardInfo?.date_provide}</div>
              <div>Giới tính</div>
              <div>{idCardInfo?.gender}</div>
              <div>Dân tộc</div>
              <div>{idCardInfo?.ethnic}</div>
              <div>Tôn giáo</div>
              <div>{idCardInfo?.religion}</div>
              <div>Quốc tịch</div>
              <div>{idCardInfo?.nationality}</div>
              <div>Tên cha</div>
              <div>{idCardInfo?.father_name}</div>
              <div>Tên mẹ</div>
              <div>{idCardInfo?.mother_name}</div>
              <div>Tên vợ/chồng</div>
              <div>{idCardInfo?.partner_name}</div>
              <div>Tên khác</div>
              <div>{idCardInfo?.otherName}</div>
              <div>Nơi sinh</div>
              <div>{idCardInfo?.place_of_origin}</div>
              <div>Nơi ở</div>
              <div>{idCardInfo?.place_of_residence}</div>
              <div>Số CMND cũ</div>
              <div>{idCardInfo?.old_citizen_identify}</div>
              <div>Đặc điểm nhận dạng</div>
              <div>{idCardInfo?.personal_identification}</div>
            </Grid>
          </div>
        </div>
      }
      <Button fullWidth className="my-4" onClick={() => {
        navigate(RoutePath.result, { state: {
          success: true,
          idCardInfo
        } })
      }} variant="primary">Tiếp tục</Button>
      </div>
    </Page>
  );
};

export default IdentificationInfoPage;