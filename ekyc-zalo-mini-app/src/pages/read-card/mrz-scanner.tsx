import { createWorker, OEM, PSM } from 'tesseract.js';
import { useEffect, useRef, useState } from 'react';
import { scanNFC } from 'zmp-sdk';
import { Box, Button, DatePicker, Grid, Input, List, useNavigate } from 'zmp-ui'
import scribe from 'scribe.js-ocr';
import { initTransaction, readCard, registerDeviceToken } from './api';
import { IDCardInformationResponse } from './models';

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
    setMRZData(mrz.join('\n'))
    setMRZError('')
    startScanNFC(mrz.join(''))
    console.log(mrz.join('').length)
  };

  const startScanNFC = (mrz: string) => {
    setNFCData(undefined)
    setNFCError('')
    scanNFC({
        type: 'cccd',
        data: {
            mrz: mrz
        }
    })
    .then(value => {
      console.log(value)
      const {sod, dg1, dg2, dg13, dg14} = value
      setNFCData(undefined)
      setNFCError('')
      return registerDeviceToken()
      .then(res => {
        return initTransaction()
      })
      .then(res => {
        return readCard(sod, dg1, dg2, dg13, dg14, res.data)
      })
      .then(res => {
        console.log(res.data)
        setNFCData(res)
      })
    })
    .catch(error => {
      setNFCData(undefined)
      setNFCError(JSON.stringify(error))
    })
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
    startScanMRZ();
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
          <Box>
            <Input
              name='idNumber'
              label={'Số CCCD'}
              onChange={handleChange}
              value={formData.idNumber}
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
              >
                Quét NFC
              </Button>
            }
          </Box>
        </form>
      }
      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{mrzData}</p>
      <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{mrzError}</p>
      {
        nfcData && <div>
          <Grid columnCount={2} columnSpace='1rem' rowSpace='1rem'>
            <div>Số CCCD</div>
            <div>{nfcData.data?.citizen_identify}</div>
            <div>Tên</div>
            <div>{nfcData.data?.full_name}</div>
            <div>Ngày sinh</div>
            <div>{nfcData.data?.date_of_birth}</div>
            <div>Ngày hết hạn</div>
            <div>{nfcData.data?.date_of_expiry}</div>
            <div>Ngày cấp</div>
            <div>{nfcData.data?.date_provide}</div>
            <div>Giới tính</div>
            <div>{nfcData.data?.gender}</div>
            <div>Dân tộc</div>
            <div>{nfcData.data?.ethnic}</div>
            <div>Tôn giáo</div>
            <div>{nfcData.data?.religion}</div>
            <div>Quốc tịch</div>
            <div>{nfcData.data?.nationality}</div>
            <div>Tên cha</div>
            <div>{nfcData.data?.father_name}</div>
            <div>Tên mẹ</div>
            <div>{nfcData.data?.mother_name}</div>
            <div>Tên vợ/chồng</div>
            <div>{nfcData.data?.partner_name}</div>
            <div>Tên khác</div>
            <div>{nfcData.data?.otherName}</div>
            <div>Nơi sinh</div>
            <div>{nfcData.data?.place_of_origin}</div>
            <div>Nơi ở</div>
            <div>{nfcData.data?.place_of_residence}</div>
            <div>Số CMND cũ</div>
            <div>{nfcData.data?.old_citizen_identify}</div>
            <div>Đặc điểm nhận dạng</div>
            <div>{nfcData.data?.personal_identification}</div>
            <div>Ảnh</div>
            <div>
              <img 
                src={`data:image/jpeg;base64,${nfcData.data?.face_image}`} 
                alt="Ảnh chân dung" 
                style={{ 
                  maxWidth: '200px', 
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }} 
              />
            </div>
          </Grid>
        </div>
      }
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
      {
        nfcData && <Button
          variant="primary"
          onClick={() => {
            setNFCData(undefined)
            startScanNFC(mrzData)
          }}
        >
          Quét lại NFC
        </Button>
      }
      {
        nfcData && <Button
          variant="primary"
          onClick={() => {
            navigate('/iproov-liveness', { state: { clientTransactionId: nfcData.request_id } })
          }}
        >
          Start liveness
        </Button>
      }
    </div>
  );
};

export default MRZScanner;
