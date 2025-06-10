import { createWorker, OEM, PSM } from 'tesseract.js';
import { useEffect, useRef, useState } from 'react';
import { scanNFC } from 'zmp-sdk';
import { Box, Button, DatePicker, Grid, Input, List } from 'zmp-ui'
import scribe from 'scribe.js-ocr';
import { initTransaction, readCard, registerDeviceToken } from './api';
import { IDCardInformation } from './models';

interface FormData {
  idNumber?: string;
  dob?: Date;
  fullName?: string;
}

const MRZScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mrzData, setMRZData] = useState('');
  const [nfcData, setNFCData] = useState<IDCardInformation | undefined>()
  const [mrzError, setMRZError] = useState('')
  const [nfcError, setNFCError] = useState('')
  const [formData, setFormData] = useState<FormData>({});

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
      // const {sod, dg1, dg2, dg13, dg14} = {
      //   "dg1": "YV1fH1pJRFZOTTA5MzAwOTEwMTcwMDEwOTMwMDkxMDE8PDg5MzA3MDY3TTMzMDcwNjVWTk08PDw8PDw8PDw8PDBOR1VZRU48PFRIQU5IPEJJTkg8PDw8PDw8PDw8PDw=",
      //   "dg2": "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",
      //   // "dg3": "",
      //   // "dg4": "",
      //   // "dg5": "",
      //   // "dg6": "",
      //   // "dg7": "",
      //   // "dg8": "",
      //   // "dg9": "",
      //   // "dg10": "",
      //   // "dg11": "",
      //   // "dg12": "",
      //   "dg13": "bYIBxDCCAcACAQEGBijTFgEACDGCAbEwEQIBARMMMDAxMDkzMDA5MTAxMBkCAQIMFE5ndXnhu4VuIFRoYW5oIELDrG5oMA8CAQMTCjA2LzA3LzE5OTMwCAIBBAwDTmFtMA8CAQUMClZp4buHdCBOYW0wCQIBBgwES2luaDALAgEHDAZLaMO0bmcwLAIBCAwnSOG7o3AgVGjhuq9uZywgVHJp4buHdSBTxqFuLCBUaGFuaCBIw7NhMFkCAQkMVDEwIE5nw6FjaCAyNzMvMTksIE5ndXnhu4VuIEtob8OhaSwgVGRwIDMzQywgVGhhbmggTMawxqFuZywgSGFpIELDoCBUcsawbmcsIEjDoCBO4buZaTAzAgEKDC5u4buRdCBydeG7k2kgYzozY20gdHLDqm4gc2F1IMSR4bqndSBtw6B5IHRyw6FpMA8CAQsTCjI1LzA0LzIwMjEwDwIBDAwKMDYvMDcvMjAzMzAxAgENMBgMFk5ndXnhu4VuIEPDtG5nIMSQaeG7h3AwEgwQSG/DoG5nIFRo4buLIFRodTADAgEOMA4CAQ8TCTAxMjk4Njg4MDAVAgEQExAwMjk0NjRCM0YwNDMwMDAw",
      //   "dg14": "boIBfjGCAXowDQYIBAB/AAcCAgICAQEwDwYKBAB/AAcCAgMCAgIBATASBgoEAH8ABwICBAICAgECAgENMIIBQgYJBAB/AAcCAgECMIIBMzCB7AYHKoZIzj0CATCB4AIBATAsBgcqhkjOPQEBAiEAqftX26Huqbw+ZgqQnYONcm479iPVJiAoIBNIHR9uU3cwRAQgfVoJdfwsMFfu9nUwQXr/5/uAVcEm3Fxs6UpLRPMwtdkEICbcXGzpSktE8zC12bvXfL+VhBYpXPfhzmvM3Bj/jAe2BEEEi9Kuuct+V8ssS0gv/IG3r7neJ+HjvSPCOkRTvZrOMmJUfvg1w9rE/Zf4RhoUYR3JwndFEy3tjlRcHVTHLwRplwIhAKn7V9uh7qm8PmYKkJ2DjXGMOXqjtWGm95AeDoKXSFanAgEBA0IABBcYmup9v4VbvejPDLYWwvvcCH8IAjO+RQWB1/s0cnixZHsAB1gCUuB6OYoD8zsa9Tlx8zltPh1DMgG391VUQsg=",
      //   // "dg15": "b4IBJjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMgdyApf6cJtt9GflAAo1J5eNypq/TNee3F4z6HtAT1h28zGkHIjvvDyQ+ll73P0wA115mA4PR2rhGF5PfmqaRnnPpcg7PFVUoHLI8xDpzGtSLwU0LiUPMeUDsxj9yxnTzd6mlVS7qb/7tej4x1EQil3uRoVbdf00+Kl5u/26jeCQ5W2Z+GbwABcO/mXTN75M3fpPIzsZFR2UE8EM84lcmsKJ72agQcqGxjp8s0ZR7hgPdjaV+8saVFus9aJlRKIXmAboVqPXmrOK0nuved4QDm4d5D9gQMx3Yw8FKHmkvN6REdr/7EMyPHwHuvxInixYumuYToTjMyg9JVi09gl/W8CAwEAAQ==",
      //   // "dg16": "",
      //   // "com": "",
      //   "sod": "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",
      //   // "challenge": "Vt3tAc1hc38=",
      //   // "aAResult": "X6Vbqi9NhYtD5efHReGOZ319E3t0Cjphsp031xFck5YrNz3KBx+WIgPGejNFV3IFgMLc72CsKEIVjN44+DOnS5Wr07aRr0W3ohUsFB1rKSvozA1sK5KcvczG5SXAvGeG+OGJlHNkT2S5Vuajow8172XdjlSeiRLFmydk5Z3Teul0PXTUwP3Rc7qPEK/FVq7MM6y7QDUWTiwBkgilPjbjySPpEmKIPQWkXUXkrIw1HjAVdkorixP7StzDRh2K74BD7kKirfIsntJJFYOHnAwP81cDVdHJjyvipB/7XXSSFyl9xXdctX+QY8KknxiQQ61t+AWNQjRyf6eCPWUgyr8unw==",
      //   // "eACCAResult": "AJoeR4Gt8+aht1TrE0Kcd/Z4wUIm8CXFV5Mt+HkQIFI="
      // }
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
        setNFCData(res.data)
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
            <div>{nfcData.citizen_identify}</div>
            <div>Tên</div>
            <div>{nfcData.full_name}</div>
            <div>Ngày sinh</div>
            <div>{nfcData.date_of_birth}</div>
            <div>Ngày hết hạn</div>
            <div>{nfcData.date_of_expiry}</div>
            <div>Ngày cấp</div>
            <div>{nfcData.date_provide}</div>
            <div>Giới tính</div>
            <div>{nfcData.gender}</div>
            <div>Dân tộc</div>
            <div>{nfcData.ethnic}</div>
            <div>Tôn giáo</div>
            <div>{nfcData.religion}</div>
            <div>Quốc tịch</div>
            <div>{nfcData.nationality}</div>
            <div>Tên cha</div>
            <div>{nfcData.father_name}</div>
            <div>Tên mẹ</div>
            <div>{nfcData.mother_name}</div>
            <div>Tên vợ/chồng</div>
            <div>{nfcData.partner_name}</div>
            <div>Tên khác</div>
            <div>{nfcData.otherName}</div>
            <div>Nơi sinh</div>
            <div>{nfcData.place_of_origin}</div>
            <div>Nơi ở</div>
            <div>{nfcData.place_of_residence}</div>
            <div>Số CMND cũ</div>
            <div>{nfcData.old_citizen_identify}</div>
            <div>Đặc điểm nhận dạng</div>
            <div>{nfcData.personal_identification}</div>
            <div>Ảnh</div>
            <div>
              <img 
                src={`data:image/jpeg;base64,${nfcData.face_image}`} 
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
    </div>
  );
};

export default MRZScanner;
