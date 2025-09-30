import { useCallback, useState } from "react";
import { Button, DatePicker, Icon, Input, Select, useNavigate } from "zmp-ui";
import { generateMrz } from "@ekyc-zma-sdk/read-card";
import RoutePath from "@/constants/route-path";
import { scanQRCode } from "zmp-sdk";
import { parse } from "date-fns";

type Gender = "M" | "F";

interface FormData {
  idNumber?: string;
  dob?: Date;
  fullName?: string;
  gender?: Gender;
}

const MRZScanner = () => {
  const [formData, setFormData] = useState<FormData>({});
  const navigate = useNavigate();
  const scanQR = useCallback(async () => {
    const arr = (await scanQRCode()).content.split("|");
    setFormData({
      dob: parse(arr[3], "ddMMyyyy", new Date()),
      fullName: arr[2],
      idNumber: arr[0],
      gender: arr[4].toLowerCase().includes("nam") ? "M" : "F",
    });
  }, []);
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const { dob, fullName, idNumber, gender } = { ...formData };
    if (!dob || !fullName || !idNumber || !gender) {
      return;
    }
    const mrz = generateMrz({
      idNumber: idNumber,
      dateOfBirth: dob,
      fullName: fullName,
      gender: gender,
    });
    startScanNFC(mrz.join(""));
  }, [formData]);

  const startScanNFC = useCallback((mrz: string) => {
    navigate(RoutePath.readCard, { state: { mrz } });
  }, []);

  return (
    <form onSubmit={handleSubmit} className={"h-full flex flex-col px-4 pb-4 mt-16"}>
      <div className="overflow-y-auto flex-1 flex flex-col gap-4">
        <Input
          name="idNumber"
          label={"Số CCCD"}
          onChange={handleChange}
          value={formData.idNumber}
          type="number"
          placeholder="Nhập hoặc Quét QR CCCD"
          suffix={
            <button onClick={() => scanQR()}>
              <Icon icon="zi-qrline" className="mr-3" />
            </button>
          }
        />
        <Input
          name="fullName"
          label={"Tên"}
          onChange={handleChange}
          value={formData.fullName}
          placeholder="Nhập hoặc Quét QR CCCD"
          suffix={
            <button onClick={() => scanQR()}>
              <Icon icon="zi-qrline" className="mr-3" />
            </button>
          }
        />
        <DatePicker
          label={"Ngày sinh"}
          onChange={(val) => setFormData({ ...formData, dob: val })}
          value={formData.dob}
          placeholder="Chọn ngày sinh"
        />
        <Select
          // defaultValue="M"
          label="Giới tính"
          placeholder="Chọn giới tính"
          value={formData.gender}
          onChange={(value) =>
            setFormData({ ...formData, gender: value as Gender })
          }
          closeOnSelect
        >
          <option title="Nam" value="M" />
          <option title="Nữ" value="F" />
        </Select>
      </div>
      <Button variant="primary" htmlType="submit" className="">
        Quét NFC
      </Button>
    </form>
  );
};

export default MRZScanner;
