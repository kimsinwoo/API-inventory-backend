/**
 * 라벨 프린트 컴포넌트 예제
 * 
 * 사용법:
 * 1. useLabelPrint hook을 hooks 폴더에 복사
 * 2. LabelPrintApi.ts를 services 폴더에 복사
 * 3. React 컴포넌트에서 import하여 사용
 */

import React, { useState, useEffect } from 'react';
import { useLabelPrint } from '../hooks/useLabelPrint';
import { Printer, TemplateType } from '../services/LabelPrintApi';

const LabelPrintComponent: React.FC = () => {
  const { loading, error, getPrinters, printLabel } = useLabelPrint();
  
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [templateType, setTemplateType] = useState<TemplateType>('large');
  const [itemId, setItemId] = useState<number>(1);
  const [manufactureDate, setManufactureDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [printCount, setPrintCount] = useState<number>(1);
  const [saveTemplate, setSaveTemplate] = useState<boolean>(false);
  
  // 템플릿별 추가 데이터
  const [productName, setProductName] = useState<string>('');
  const [storageCondition, setStorageCondition] = useState<string>('냉동');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [categoryAndForm, setCategoryAndForm] = useState<string>('');
  const [ingredients, setIngredients] = useState<string>('');
  const [rawMaterials, setRawMaterials] = useState<string>('');
  const [actualWeight, setActualWeight] = useState<string>('');
  
  const [printResult, setPrintResult] = useState<any>(null);

  // 오늘 날짜를 기본값으로 설정
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setManufactureDate(today);
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
    if (!itemId || itemId < 1 || itemId > 999) {
      alert('아이템 ID는 1-999 사이의 숫자여야 합니다.');
      return;
    }

    if (!manufactureDate || !expiryDate) {
      alert('제조일자와 유통기한을 입력해주세요.');
      return;
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(manufactureDate) || !dateRegex.test(expiryDate)) {
      alert('날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }

    // 날짜 유효성 검증
    const manufacture = new Date(manufactureDate);
    const expiry = new Date(expiryDate);
    if (expiry < manufacture) {
      alert('유통기한이 제조일자보다 이전일 수 없습니다.');
      return;
    }

    const result = await printLabel({
      templateType,
      itemId,
      manufactureDate,
      expiryDate,
      printerName: selectedPrinter || undefined,
      printCount,
      saveTemplate,
      productName: productName || undefined,
      storageCondition: storageCondition || undefined,
      registrationNumber: registrationNumber || undefined,
      categoryAndForm: categoryAndForm || undefined,
      ingredients: ingredients || undefined,
      rawMaterials: rawMaterials || undefined,
      actualWeight: actualWeight || undefined,
    });

    if (result) {
      setPrintResult(result);
      if (result.mode === 'cloud' && result.filePath) {
        alert(`PDF 파일이 저장되었습니다: ${result.filePath}`);
      } else if (!result.error) {
        alert(`프린트 완료: ${result.printerName || '로컬 프린터'}`);
      } else {
        alert(`프린트 실패: ${result.error}`);
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
          {printResult.error ? (
            <div>오류: {printResult.error}</div>
          ) : (
            <div>
              <div>성공: {printResult.mode === 'cloud' ? 'PDF 저장됨' : '프린트 완료'}</div>
              <div>바코드: {printResult.barcode}</div>
              {printResult.filePath && <div>파일 경로: {printResult.filePath}</div>}
              {printResult.printerName && <div>프린터: {printResult.printerName}</div>}
            </div>
          )}
        </div>
      )}

      {/* 템플릿 타입 선택 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          템플릿 타입: <span style={{ color: 'red' }}>*</span>
        </label>
        <select
          value={templateType}
          onChange={(e) => setTemplateType(e.target.value as TemplateType)}
          disabled={loading}
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        >
          <option value="large">Large (100mm x 100mm)</option>
          <option value="medium">Medium (80mm x 60mm)</option>
          <option value="small">Small (50mm x 30mm)</option>
          <option value="verysmall">Very Small (26mm x 18mm)</option>
        </select>
      </div>

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

      {/* 아이템 ID */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          아이템 ID (1-999): <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="number"
          value={itemId}
          onChange={(e) => setItemId(Number(e.target.value))}
          min={1}
          max={999}
          disabled={loading}
          required
          style={{ width: '100%', padding: '8px', fontSize: '14px' }}
        />
      </div>

      {/* 제조일자 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          제조일자 (YYYY-MM-DD): <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="date"
          value={manufactureDate}
          onChange={(e) => setManufactureDate(e.target.value)}
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

      {/* 템플릿 저장 여부 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            checked={saveTemplate}
            onChange={(e) => setSaveTemplate(e.target.checked)}
            disabled={loading}
          />
          <span>템플릿 데이터 저장</span>
        </label>
      </div>

      {/* 템플릿별 추가 데이터 (Large/Medium용) */}
      {(templateType === 'large' || templateType === 'medium') && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <h3>추가 정보 (선택사항)</h3>
          
          <div style={{ marginBottom: '10px' }}>
            <label>제품명:</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>보관 조건:</label>
            <select
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
            >
              <option value="냉동">냉동</option>
              <option value="냉장">냉장</option>
              <option value="상온">상온</option>
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>등록번호:</label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              disabled={loading}
              style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
            />
          </div>

          {templateType === 'large' && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label>종류 및 형태:</label>
                <input
                  type="text"
                  value={categoryAndForm}
                  onChange={(e) => setCategoryAndForm(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>성분량:</label>
                <input
                  type="text"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>원료의 명칭:</label>
                <input
                  type="text"
                  value={rawMaterials}
                  onChange={(e) => setRawMaterials(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>실제중량:</label>
                <input
                  type="text"
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
                />
              </div>
            </>
          )}

          {templateType === 'medium' && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label>종류 및 형태:</label>
                <input
                  type="text"
                  value={categoryAndForm}
                  onChange={(e) => setCategoryAndForm(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label>성분량:</label>
                <input
                  type="text"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '8px', fontSize: '14px', marginTop: '5px' }}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* 프린트 버튼 */}
      <button
        onClick={handlePrint}
        disabled={loading || !itemId || !manufactureDate || !expiryDate}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '16px',
          backgroundColor: loading || !itemId || !manufactureDate || !expiryDate ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading || !itemId || !manufactureDate || !expiryDate ? 'not-allowed' : 'pointer',
          marginTop: '20px',
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
          <li>아이템 ID는 1-999 사이의 숫자여야 합니다.</li>
          <li>제조일자와 유통기한은 필수 입력 항목입니다.</li>
          <li>날짜는 YYYY-MM-DD 형식으로 입력해주세요.</li>
          <li>유통기한은 제조일자보다 이후여야 합니다.</li>
          <li>로컬 환경: 프린터를 선택하면 지정한 프린터로 직접 출력됩니다.</li>
          <li>클라우드 환경: 프린터 선택 없이도 PDF 파일로 저장됩니다.</li>
          <li>바코드는 자동으로 생성됩니다 (아이템 ID + 제조일자 + 유통기한).</li>
        </ul>
      </div>
    </div>
  );
};

export default LabelPrintComponent;

