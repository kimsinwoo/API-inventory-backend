/**
 * 라벨 프린트를 위한 React Hook
 */

import { useState, useCallback } from 'react';
import { labelApi, Printer, PrintLabelRequest, PrintLabelResponse, LabelTemplate, SaveTemplateRequest } from './LabelPrintApi';

export const useLabelPrint = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 프린터 목록 조회
   */
  const getPrinters = useCallback(async (): Promise<Printer[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await labelApi.getPrinters();
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
   * 라벨 프린트
   */
  const printLabel = useCallback(async (data: PrintLabelRequest): Promise<PrintLabelResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await labelApi.printLabel(data);
      if (response.ok && response.data) {
        return response.data as PrintLabelResponse;
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
   * 템플릿 저장
   */
  const saveTemplate = useCallback(async (data: SaveTemplateRequest): Promise<LabelTemplate | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await labelApi.saveTemplate(data);
      if (response.ok && response.data) {
        return response.data as LabelTemplate;
      } else {
        setError(response.message || '템플릿 저장 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '템플릿 저장 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 템플릿 목록 조회
   */
  const getTemplates = useCallback(async (page: number = 1, limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await labelApi.getTemplates(page, limit);
      if (response.ok) {
        return {
          templates: response.data || [],
          meta: response.meta,
        };
      } else {
        setError(response.message || '템플릿 목록 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '템플릿 목록 조회 중 오류 발생';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 템플릿 조회
   */
  const getTemplate = useCallback(async (templateId: number): Promise<LabelTemplate | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await labelApi.getTemplate(templateId);
      if (response.ok && response.data) {
        return response.data as LabelTemplate;
      } else {
        setError(response.message || '템플릿 조회 실패');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '템플릿 조회 중 오류 발생';
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
    printLabel,
    saveTemplate,
    getTemplates,
    getTemplate,
  };
};

