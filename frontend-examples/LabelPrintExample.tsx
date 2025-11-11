/**
 * 라벨 프린트 컴포넌트 예제
 * 
 * 사용법:
 * 1. 이 파일을 프론트엔드 프로젝트의 components 폴더에 복사
 * 2. useBarcodeApi hook을 hooks 폴더에 복사
 * 3. barcodeApi.ts를 services 폴더에 복사
 * 4. React 컴포넌트에서 import하여 사용
 * 
 * @example
 * ```tsx
 * import LabelPrintExample from './components/LabelPrintExample';
 * 
 * function App() {
 *   return <LabelPrintExample />;
 * }
 * ```
 */

import React, { useState, useEffect } from 'react';
import { useBarcodeApi } from '../hooks/useBarcodeApi';
import { Printer, FinishedItem } from '../services/barcodeApi';

const LabelPrintExample: React.FC = () => {
  const { loading, error, getPrinters, getFinishedItems, printLabel } = useBarcodeApi();
  
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [finishedItems, setFinishedItems] = useState<FinishedItem[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [printCount, setPrintCount] = useState<number>(1);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [printResult, setPrintResult] = useState<any>(null);

  // 컴포넌트 마운트 시 프린터 목록 및 품목 목록 조회
  useEffect(() => {
    const loadData = async () => {
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

      const items = await getFinishedItems();
      if (items) {
        setFinishedItems(items);
      }
    };

    loadData();
  }, [getPrinters, getFinishedItems]);

  // 라벨 HTML 생성 (예제)
  const generateLabelHtml = (item: FinishedItem): string => {
    const currentDate = new Date().toISOString().split('T')[0];
    return `
      <div style="width: 50mm; height: 30mm; border: 2px solid #000; padding: 5px; font-family: Arial, sans-serif;">
        <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 5px;">
          ${item.name}
        </div>
        <div style="font-size: 10px; margin-bottom: 3px;">
          코드: ${item.code}
        </div>
        <div style="font-size: 10px; margin-bottom: 3px;">
          단위: ${item.unit}
        </div>
        <div style="font-size: 8px; margin-top: 5px; border-top: 1px solid #000; padding-top: 3px;">
          제조일자: ${currentDate}
        </div>
        <div style="text-align: center; margin-top: 5px; font-size: 12px;">
          [바코드 이미지 영역]
        </div>
      </div>
    `;
  };

  // 프린트 처리
  const handlePrint = async () => {
    if (!selectedItem) {
      alert('품목을 선택해주세요.');
      return;
    }

    const item = finishedItems.find((i) => i.id === selectedItem);
    if (!item) {
      alert('선택한 품목을 찾을 수 없습니다.');
      return;
    }

    // 라벨 HTML 생성
    const labelHtml = htmlContent || generateLabelHtml(item);

    // 프린트 요청
    const result = await printLabel({
      htmlContent: labelHtml,
      printerName: selectedPrinter || undefined, // 클라우드 환경에서는 undefined
      printCount,
      pdfOptions: {
        width: '50mm',
        height: '30mm',
        margin: '0mm',
      },
      productName: item.name,
      itemId: item.id,
    });

    if (result) {
      setPrintResult(result);
      if (result.mode === 'cloud' && result.filePath) {
        alert(`PDF 파일이 저장되었습니다: ${result.filePath}\n클라우드 환경에서는 PDF 파일로 저장됩니다.`);
      } else {
        alert(`프린트 완료: ${result.printerName || '로컬 프린터'}`);
      }
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>라벨 프린트</h2>

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
          {printResult.error ? `오류: ${printResult.error}` : `성공: ${printResult.mode === 'cloud' ? 'PDF 저장됨' : '프린트 완료'}`}
          {printResult.filePath && <div>파일 경로: {printResult.filePath}</div>}
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
          disabled={loading || printers.length === 0}
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

      {/* 품목 선택 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          품목 선택: <span style={{ color: 'red' }}>*</span>
        </label>
        <select
          value={selectedItem || ''}
          onChange={(e) => setSelectedItem(Number(e.target.value) || null)}
          disabled={loading}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        >
          <option value="">품목 선택</option>
          {finishedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.code}) - {item.unit}
            </option>
          ))}
        </select>
      </div>

      {/* 프린트 개수 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          프린트 개수:
        </label>
        <input
          type="number"
          value={printCount}
          onChange={(e) => setPrintCount(Number(e.target.value))}
          min={1}
          disabled={loading}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>

      {/* 라벨 HTML 내용 (선택사항) */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          라벨 HTML 내용 (선택사항 - 비워두면 자동 생성):
        </label>
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          rows={10}
          disabled={loading}
          placeholder="라벨 HTML 내용을 입력하세요. 비워두면 선택한 품목 정보로 자동 생성됩니다."
          style={{ width: '100%', padding: '8px', fontSize: '12px', fontFamily: 'monospace' }}
        />
      </div>

      {/* 프린트 버튼 */}
      <button
        onClick={handlePrint}
        disabled={loading || !selectedItem}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading || !selectedItem ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading || !selectedItem ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? '프린트 중...' : '프린트'}
      </button>

      {/* 사용 안내 */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px', fontSize: '12px' }}>
        <h4>사용 안내:</h4>
        <ul>
          <li>로컬 환경: 프린터를 선택하면 지정한 프린터로 직접 출력됩니다.</li>
          <li>클라우드 환경: 프린터 선택 없이도 PDF 파일로 저장됩니다.</li>
          <li>라벨 HTML 내용을 입력하지 않으면 선택한 품목 정보로 자동 생성됩니다.</li>
          <li>프린트 개수만큼 동일한 라벨이 출력됩니다.</li>
        </ul>
      </div>
    </div>
  );
};

export default LabelPrintExample;


