/**
 * 바코드 API를 위한 React Hook
 * 
 * 사용법:
 * 1. 이 파일을 프론트엔드 프로젝트의 hooks 폴더에 복사
 * 2. barcodeApi.ts 파일을 services 폴더에 복사
 * 3. React 컴포넌트에서 사용
 * 
 * @example
 * ```tsx
 * const { loading, error, getPrinters, printLabel } = useBarcodeApi();
 * 
 * useEffect(() => {
 *   const loadPrinters = async () => {
 *     const printers = await getPrinters();
 *     console.log(printers);
 *   };
 *   loadPrinters();
 * }, []);
 * ```
 */

import { useState, useCallback } from 'react';
import { barcodeApi, ApiResponse, Printer, Label, PrintLabelRequest, PrintSavedLabelRequest, FinishedItem, BarcodeInfo } from '../services/barcodeApi';

export const useBarcodeApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 프린터 목록 조회
   */
  const getPrinters = useCallback(async (): Promise<Printer[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getPrinters();
      if (response.ok) {
        return response.data || [];
      } else {
        setError(response.message || '프린터 목록 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '프린터 목록 조회 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Finished 품목 목록 조회
   */
  const getFinishedItems = useCallback(async (): Promise<FinishedItem[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getFinishedItems();
      if (response.ok) {
        return response.data || [];
      } else {
        setError(response.message || '품목 목록 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '품목 목록 조회 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 라벨 프린트
   */
  const printLabel = useCallback(async (data: PrintLabelRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.printLabel(data);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || response.error || '라벨 프린트 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '라벨 프린트 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 저장된 라벨 프린트
   */
  const printSavedLabel = useCallback(async (data: PrintSavedLabelRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.printSavedLabel(data);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || response.error || '라벨 프린트 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '라벨 프린트 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 라벨 생성
   */
  const createLabel = useCallback(async (data: {
    itemId: number;
    inventoryId: number;
    barcode: string;
    quantity?: number;
    unit?: string;
  }): Promise<Label | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.createLabel(data);
      if (response.ok && response.data) {
        return response.data as Label;
      } else {
        setError(response.message || '라벨 생성 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '라벨 생성 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 라벨 목록 조회
   */
  const getLabels = useCallback(async (page: number = 1, limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getLabels(page, limit);
      if (response.ok) {
        return {
          labels: response.data || [],
          meta: response.meta,
        };
      } else {
        setError(response.message || '라벨 목록 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '라벨 목록 조회 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 라벨 ID로 조회
   */
  const getLabelById = useCallback(async (labelId: number): Promise<Label | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getLabelById(labelId);
      if (response.ok && response.data) {
        return response.data as Label;
      } else {
        setError(response.message || '라벨 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '라벨 조회 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 바코드로 라벨 조회
   */
  const getLabelsByBarcode = useCallback(async (barcode: string): Promise<Label[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getLabelsByBarcode(barcode);
      if (response.ok) {
        return response.data || [];
      } else {
        setError(response.message || '라벨 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '라벨 조회 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 바코드 스캔
   */
  const scanBarcode = useCallback(async (barcode: string): Promise<BarcodeInfo | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.scanBarcode(barcode);
      if (response.ok && response.data) {
        return response.data as BarcodeInfo;
      } else {
        setError(response.message || '바코드 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '바코드 조회 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 바코드 생성
   */
  const generateBarcode = useCallback(async (data: {
    itemId: number;
    quantity: number;
    receivedAt?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.generateBarcode(data);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || '바코드 생성 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '바코드 생성 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 입고 처리
   */
  const receiveWithBarcode = useCallback(async (data: {
    barcode: string;
    itemId: number;
    factoryId: number;
    storageConditionId: number;
    wholesalePrice: number;
    quantity: number;
    receivedAt?: string;
    unit?: string;
    note?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.receiveWithBarcode(data);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || '입고 처리 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '입고 처리 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 바코드 이력 조회
   */
  const getBarcodeHistory = useCallback(async (barcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getBarcodeHistory(barcode);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || '바코드 이력 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '바코드 이력 조회 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPrinters,
    getFinishedItems,
    printLabel,
    printSavedLabel,
    createLabel,
    getLabels,
    getLabelById,
    getLabelsByBarcode,
    scanBarcode,
    generateBarcode,
    receiveWithBarcode,
    getBarcodeHistory,
  };
};


