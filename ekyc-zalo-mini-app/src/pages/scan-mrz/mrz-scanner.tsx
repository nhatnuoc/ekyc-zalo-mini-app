import { createWorker, OEM, PSM } from 'tesseract.js';
import { useEffect, useRef, useState } from 'react';
import { scanNFC } from 'zmp-sdk';
import { Box, Button, DatePicker, Grid, Input, List, useNavigate } from 'zmp-ui'
import scribe from 'scribe.js-ocr';
import { IDCardInformationResponse } from '../read-card/models';
import RoutePath from '@/constants/route-path';

interface FormData {
  idNumber?: string;
  dob?: Date;
  fullName?: string;
}

const MRZScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
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
    const doe = (function getCccdExpiryDate(birthDate: Date): string {
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();

      let nextMilestoneAge: number;

      if (age < 25) {
        nextMilestoneAge = 25;
      } else if (age < 40) {
        nextMilestoneAge = 40;
      } else if (age < 60) {
        nextMilestoneAge = 60;
      } else {
        return 'Vô thời hạn';
      }

      // Tạo ngày sinh nhật ở mốc tuổi tiếp theo
      const expiryDate = new Date(birthDate);
      expiryDate.setFullYear(birthDate.getFullYear() + nextMilestoneAge);
      expiryDate.setDate(expiryDate.getDate()); // Ngày trước sinh nhật

      // Format thành chuỗi YYYY-MM-DD
      return formatDateToYYMMDD(expiryDate);
    })(dob)
    function removeVietnameseTones(str) {
      return str
        .normalize('NFD') // tách dấu ra khỏi ký tự gốc
        .replace(/[\u0300-\u036f]/g, '') // xóa các dấu
        .replace(/đ/g, 'd') // thay đ
        .replace(/Đ/g, 'D') // thay Đ
        .replace(/[^a-zA-Z0-9 ]/g, '') // xóa ký tự đặc biệt nếu cần
        .trim();
    }
    function padRight(str: string, length: number, char = '<') {
      return str.padEnd(length, char).toUpperCase();
    }
    function computeCheckDigit(input: string): string {
      const weights = [7, 3, 1];
      const charValue = (char: string): number => {
        if (char >= '0' && char <= '9') return parseInt(char, 10);
        if (char >= 'A' && char <= 'Z') return char.charCodeAt(0) - 55;
        if (char === '<') return 0;
        return 0;
      };

      let sum = 0;
      for (let i = 0; i < input.length; i++) {
        sum += charValue(input[i]) * weights[i % 3];
      }
      return (sum % 10).toString();
    }

    function generateMrz({
      idNumber,
      birthDate,   // dạng YYYY-MM-DD
      expiryDate,  // dạng YYYY-MM-DD
      gender,
      fullName,    // VD: "Nguyen Van A"
    }: {
      idNumber: string,
      birthDate: string,
      expiryDate: string,
      gender: 'M' | 'F',
      fullName: string,
    }): string[] {
      const documentCode = 'ID';           // I = identity document
      const issuingCountry = 'VNM';       // Vietnam
      const id9 = idNumber.slice(-9);
      const id12 = idNumber.slice(-12);

      // const line1 = padRight(`${documentCode}${issuingCountry}${id9}${id12}`, 30);
      // const line2 = padRight(`${formatDate(birthDate)}${gender}${formatDate(expiryDate)}`, 30);

      const names = removeVietnameseTones(fullName).toUpperCase().split(' ');
      const lastName = names[0];
      const givenNames = names.slice(1).join('<');
      const line3 = padRight(`${lastName}<<${givenNames}`, 30);
      const line1 = `${documentCode}${issuingCountry}${id9}${computeCheckDigit(id9)}${padRight(id12, 14, '<')}${computeCheckDigit(padRight(id12, 14, '<'))}`;
      // const line1CheckDigit = computeCheckDigit(idNumber.padEnd(14, '<'));

      const line2 = `${birthDate}${computeCheckDigit(birthDate)}${gender}${expiryDate}${computeCheckDigit(expiryDate)}${issuingCountry}`;
      return [line1, `${padRight(line2, 29, '<')}${computeCheckDigit(line2)}`, line3];
    }
    function formatDateToYYMMDD(dateInput: Date) {
      const date = new Date(dateInput);
      const yy = String(date.getFullYear()).slice(-2);
      const mm = String(date.getMonth() + 1).padStart(2, '0'); // tháng bắt đầu từ 0
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yy}${mm}${dd}`;
    }

    const mrz = generateMrz({
      idNumber: idNumber,
      birthDate: formatDateToYYMMDD(dob),
      expiryDate: doe,
      fullName: fullName,
      gender: 'M'
    })
    console.log(mrz.join('').length)
    startScanNFC(mrz.join(''))
  };

  const startScanNFC = (mrz: string) => {
    navigate(RoutePath.readCard, { state: { mrz }})
  }
  
  const startScanMRZ = async () => {
    try {
      setMRZData('')
      setMRZError('')
      setNFCData(undefined)
      setNFCError('')
      // Bật camera sau
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const worker = await createWorker('ocrb', OEM.TESSERACT_ONLY, { 
        workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
        gzip: true, 
        langPath: 'https://cdn.jsdelivr.net/gh/nhatnuoc/orcb-traineddata@main/tessdata',
      });
      await worker.setParameters({
      //   tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ<0123456789',
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Assume a single uniform block of text
      preserve_interword_spaces: '1',
      });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      const scanMRZ = async () => {
        if (!videoRef.current || !context) return;

        // Cắt khung OCR từ video
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const {
          data: { text },
        } = await worker.recognize(canvas);
        // const res = await scribe.extractText(['https://tesseract.projectnaptha.com/img/eng_bw.png'])
        // console.log(res)

        // Lọc MRZ (thường có 2 dòng, nhiều ký tự <, số, A-Z)
        const mrzLines = text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => /^[A-Z0-9<]{30,}$/.test(line)); // điều kiện đơn giản

        if (mrzLines.length > 2) {
          const mrz = mrzLines.join('')
          console.log('mrz: ', mrz, 'mrz length: ', mrz.length)
          setMRZData(mrzLines.join('\n'));
          setMRZError('')
          stopScanMRZ()
          startScanNFC(mrz)
        } else {
          setMRZData('');
          setMRZError('Không tìm thấy chuỗi mrz')
        }
      };

      const interval = setInterval(scanMRZ, 1000); // scan mỗi 3 giây
      const stopScanMRZ = () => {
        clearInterval(interval);
        stream.getTracks().forEach((track) => track.stop());
        worker.terminate();
      }
      return () => {
        stopScanMRZ()
      };
    } catch (err) {
      console.error('Lỗi khi khởi động OCR:', err);
    }
  };
  useEffect(() => {
    // startScanMRZ();
  }, []);
  const showScanMRZ = false

  return (
    <div style={{ marginTop: '3rem'}}>
      {
        showScanMRZ && <div
          style={{
            position: 'relative',
            width: '100%',
            height: '400px', // Chiều cao khung camera
            overflow: 'hidden',
            backgroundColor: '#000',
          }}
        >
          {/* Video preview */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />

          {/* Khung MRZ – nằm ở đáy, chiếm khoảng 20% chiều cao */}
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              left: '5%',
              width: '90%',
              height: '20%',
              border: '2px dashed #00FF00',
              boxSizing: 'border-box',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Gợi ý hoặc hướng dẫn người dùng */}
          <div
            style={{
              position: 'absolute',
              bottom: '5%',
              left: '0',
              width: '100%',
              textAlign: 'center',
              color: 'white',
              fontSize: '14px',
              textShadow: '0 0 4px black',
              zIndex: 2,
            }}
          >
            Đặt vùng MRZ của CCCD/hộ chiếu vào trong khung
          </div>
        </div>
      }
      {
        !showScanMRZ && <form onSubmit={handleSubmit}>
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
      }
      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{mrzData}</p>
      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{mrzError}</p>
      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{nfcError}</p>
      {
        mrzData && <Button
          variant="primary"
          onClick={() => {
            setMRZData("")
            setNFCData(undefined)
            startScanMRZ()
          }}
        >
          Quét lại MRZ
        </Button>
      }
    </div>
  );
};

export default MRZScanner;
