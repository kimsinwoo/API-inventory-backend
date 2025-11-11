/**
 * 저장된 라벨 프린트 컴포넌트 예제
 * 
 * 사용법:
 * 1. 이 파일을 프론트엔드 프로젝트의 components 폴더에 복사
 * 2. useBarcodeApi hook을 hooks 폴더에 복사
 * 3. barcodeApi.ts를 services 폴더에 복사
 * 4. React 컴포넌트에서 import하여 사용
 * 
 * @example
 * ```tsx
 * import PrintSavedLabelExample from './components/PrintSavedLabelExample';
 * 
 * function App() {
 *   return <PrintSavedLabelExample labelId={123} barcode="12345678901234" />;
 * }
 * ```
 */

import React, { useState, useEffect } from 'react';
import { useBarcodeApi } from '../hooks/useBarcodeApi';
import { Printer } from '../services/barcodeApi';

interface PrintSavedLabelProps {
  labelId: number;
  barcode: string;
  onPrintSuccess?: (result: any) => void;
  onPrintError?: (error: string) => void;
}

const PrintSavedLabelExample: React.FC<PrintSavedLabelProps> = ({
  labelId,
  barcode,
  onPrintSuccess,
  onPrintError,
}) => {
  const { loading, error, printSavedLabel, getPrinters } = useBarcodeApi();
  
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [printCount, setPrintCount] = useState<number>(1);
  const [manufactureDate, setManufactureDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [printResult, setPrintResult] = useState<any>(null);

  // 오늘 날짜를 기본값으로 설정
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setManufactureDate(today);
    // 기본 유통기한: 제조일자 + 1년
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    setExpiryDate(oneYearLater.toISOString().split('T')[0]);
  }, []);

  // 프린터 목록 조회
  useEffect(() => {
    const loadPrinters = async () => {
      const printerList = await getPrinters();
      if (printerList) {
        setPrinters(printerList);
        // 기본 프린터 선택
        const defaultPrinter = printerList.find((p) => p.isDefault);
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
        } else if (printerList.length > 0) {
          setSelectedPrinter(printerList[0].name);
        }
      }
    };
    loadPrinters();
  }, [getPrinters]);

  // 프린트 처리
  const handlePrint = async () => {
    if (!manufactureDate || !expiryDate) {
      const errorMsg = '제조일자와 유통기한을 입력해주세요.';
      alert(errorMsg);
      if (onPrintError) {
        onPrintError(errorMsg);
      }
      return;
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(manufactureDate) || !dateRegex.test(expiryDate)) {
      const errorMsg = '날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.';
      alert(errorMsg);
      if (onPrintError) {
        onPrintError(errorMsg);
      }
      return;
    }

    // 날짜 유효성 검증
    const manufacture = new Date(manufactureDate);
    const expiry = new Date(expiryDate);
    if (expiry < manufacture) {
      const errorMsg = '유통기한이 제조일자보다 이전일 수 없습니다.';
      alert(errorMsg);
      if (onPrintError) {
        onPrintError(errorMsg);
      }
      return;
    }

    const result = await printSavedLabel({
      labelId,
      printerName: selectedPrinter || undefined, // 클라우드 환경에서는 undefined
      manufactureDate,
      expiryDate,
      printCount,
      pdfOptions: {
        width: '50mm',
        height: '30mm',
        margin: '0mm',
      },
    });

    if (result) {
      setPrintResult(result);
      if (result.mode === 'cloud' && result.filePath) {
        const successMsg = `PDF 파일이 저장되었습니다: ${result.filePath}`;
        alert(successMsg);
        if (onPrintSuccess) {
          onPrintSuccess(result);
        }
      } else if (!result.error) {
        const successMsg = `프린트 완료: ${result.printerName || '로컬 프린터'}`;
        alert(successMsg);
        if (onPrintSuccess) {
          onPrintSuccess(result);
        }
      } else {
        const errorMsg = result.error || '프린트 실패';
        alert(errorMsg);
        if (onPrintError) {
          onPrintError(errorMsg);
        }
      }
    } else {
      const errorMsg = '프린트 요청 실패';
      if (onPrintError) {
        onPrintError(errorMsg);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h3>저장된 라벨 프린트</h3>
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <div><strong>라벨 ID:</strong> {labelId}</div>
        <div><strong>바코드:</strong> {barcode}</div>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#ffe6e6', 
          borderRadius: '5px' 
        }}>
          오류: {error}
        </div>
      )}

      {printResult && (
        <div style={{ 
          color: printResult.error ? 'red' : 'green', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: printResult.error ? '#ffe6e6' : '#e6ffe6', 
          borderRadius: '5px' 
        }}>
          {printResult.error ? (
            <div>오류: {printResult.error}</div>
          ) : (
            <div>
              <div>성공: {printResult.mode === 'cloud' ? 'PDF 저장됨' : '프린트 완료'}</div>
              {printResult.filePath && <div>파일 경로: {printResult.filePath}</div>}
              {printResult.printerName && <div>프린터: {printResult.printerName}</div>}
              {printResult.printedAt && <div>프린트 시간: {new Date(printResult.printedAt).toLocaleString()}</div>}
            </div>
          )}
        </div>
      )}

      {/* 프린터 선택 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          프린터 선택:
        </label>
        <select
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          disabled={loading}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        >
          <option value="">프린터 선택 (선택사항 - 클라우드 환경)</option>
          {printers.map((printer) => (
            <option key={printer.name} value={printer.name}>
              {printer.name} {printer.isDefault && '(기본)'} - {printer.status}
            </option>
          ))}
        </select>
        {printers.length === 0 && (
          <div style={{ color: 'orange', marginTop: '5px', fontSize: '12px' }}>
            ⚠ 프린터가 없습니다. 클라우드 환경일 수 있으며, PDF 파일로 저장됩니다.
          </div>
        )}
      </div>

      {/* 제조일자 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          제조일자 (YYYY-MM-DD): <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="date"
          value={manufactureDate}
          onChange={(e) => {
            setManufactureDate(e.target.value);
            // 제조일자가 변경되면 유통기한도 자동 조정 (선택사항)
            if (expiryDate && new Date(expiryDate) < new Date(e.target.value)) {
              const newExpiryDate = new Date(e.target.value);
              newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
              setExpiryDate(newExpiryDate.toISOString().split('T')[0]);
            }
          }}
          disabled={loading}
          required
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>

      {/* 유통기한 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          유통기한 (YYYY-MM-DD): <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          disabled={loading}
          min={manufactureDate}
          required
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
        {expiryDate && manufactureDate && new Date(expiryDate) < new Date(manufactureDate) && (
          <div style={{ color: 'red', marginTop: '5px', fontSize: '12px' }}>
            ⚠ 유통기한이 제조일자보다 이전일 수 없습니다.
          </div>
        )}
      </div>

      {/* 프린트 개수 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          프린트 개수:
        </label>
        <input
          type="number"
          value={printCount}
          onChange={(e) => setPrintCount(Math.max(1, Number(e.target.value)))}
          min={1}
          disabled={loading}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>

      {/* 프린트 버튼 */}
      <button
        onClick={handlePrint}
        disabled={loading || !manufactureDate || !expiryDate}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          backgroundColor: loading || !manufactureDate || !expiryDate ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading || !manufactureDate || !expiryDate ? 'not-allowed' : 'pointer',
          marginBottom: '15px',
        }}
      >
        {loading ? '프린트 중...' : '프린트'}
      </button>

      {/* 사용 안내 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '5px', 
        fontSize: '12px' 
      }}>
        <h4>사용 안내:</h4>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>제조일자와 유통기한은 필수 입력 항목입니다.</li>
          <li>날짜는 YYYY-MM-DD 형식으로 입력해주세요.</li>
          <li>유통기한은 제조일자보다 이후여야 합니다.</li>
          <li>로컬 환경: 프린터를 선택하면 지정한 프린터로 직접 출력됩니다.</li>
          <li>클라우드 환경: 프린터 선택 없이도 PDF 파일로 저장됩니다.</li>
          <li>프린트 개수만큼 동일한 라벨이 출력됩니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default PrintSavedLabelExample;


