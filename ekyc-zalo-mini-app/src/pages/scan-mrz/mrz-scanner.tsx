import { useRef, useState } from 'react';
import { Button, DatePicker, Input, useNavigate } from 'zmp-ui'
import { IDCardInformationResponse, generateMrz } from '@ekyc-zma-sdk/read-card';
import RoutePath from '@/constants/route-path';

interface FormData {
  idNumber?: string;
  dob?: Date;
  fullName?: string;
}

const MRZScanner = () => {
  const [mrzData, setMRZData] = useState('');
  const [nfcData, setNFCData] = useState<IDCardInformationResponse | undefined>()
  const [mrzError, setMRZError] = useState('')
  const [nfcError, setNFCError] = useState('')
  const [formData, setFormData] = useState<FormData>({});
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    const { dob, fullName, idNumber } = {...formData}
    if (!dob || !fullName || !idNumber) {
      
      return
    }

    const mrz = generateMrz({
      idNumber: idNumber,
      dateOfBirth: dob,
      fullName: fullName,
      gender: 'M'
    })
    console.log(mrz.join('').length)
    startScanNFC(mrz.join(''))
  };

  const startScanNFC = (mrz: string) => {
    navigate(RoutePath.readCard, { state: { mrz }})
  }

  return (
    <div style={{ marginTop: '3rem'}}>
      <form onSubmit={handleSubmit}>
        <div>
          <Input
            name='idNumber'
            label={'Số CCCD'}
            onChange={handleChange}
            value={formData.idNumber}
            type='number'
          />
          <Input
            name='fullName'
            label={'Tên'}
            onChange={handleChange}
            value={formData.fullName}
          />
          <DatePicker
            label={'Ngày sinh'}
            onChange={(val) =>
              setFormData({ ...formData, dob: val })
            }
            
            value={formData.dob}
          />
          {
            !mrzData && !nfcData && <Button
              variant="primary"
              htmlType='submit'
              className='bg-primary text-neutral-900 mt-12'
              fullWidth
            >
              Quét NFC
            </Button>
          }
        </div>
      </form>
    </div>
  );
};

export default MRZScanner;
