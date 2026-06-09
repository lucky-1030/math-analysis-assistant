import { useState, useCallback } from 'react';
import api from '../api';

interface UploadZoneProps {
  onUploadSuccess?: (data: { nodes: any[]; edges: any[] }) => void;
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = async (file: File) => {
    // 检查文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('❌ 不支持的文件格式，请上传 PDF、Word 或图片');
      return;
    }

    setIsUploading(true);
    setUploadStatus('正在解析文档，提取知识点...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setUploadStatus(`✅ "${file.name}" 解析成功！提取了 ${response.data.nodes?.length || 0} 个知识点`);
        onUploadSuccess?.(response.data);
      } else {
        setUploadStatus(`⚠️ ${response.data.warning || '解析遇到问题'}`);
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      const msg = error.response?.data?.error || error.message || '未知错误';
      setUploadStatus(`❌ 解析失败: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-primary bg-blue-50 scale-[1.02]'
            : 'border-border bg-surface hover:border-primary-light hover:bg-surface-alt'
          }
          ${isUploading ? 'opacity-70 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="pointer-events-none">
          <div className="text-5xl mb-4">{isUploading ? '⏳' : '📚'}</div>
          <h3 className="text-lg font-semibold text-text mb-2">
            {isUploading ? '正在解析教材...' : '拖拽教材到此处，或点击上传'}
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            支持 PDF、Word、图片格式
          </p>
          <div className="flex justify-center gap-2 text-xs text-text-secondary">
            <span className="px-2 py-1 bg-surface-alt rounded border border-border">PDF</span>
            <span className="px-2 py-1 bg-surface-alt rounded border border-border">Word</span>
            <span className="px-2 py-1 bg-surface-alt rounded border border-border">PNG/JPG</span>
          </div>
        </div>
      </div>

      {uploadStatus && (
        <div className={`mt-4 p-3 rounded-lg text-sm text-center ${
          uploadStatus.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
          uploadStatus.startsWith('❌') ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
}
