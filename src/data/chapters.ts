export interface Chapter {
  id: string;
  title: string;
  book: string;
  description: string;
  nodeCount: number;
  edgeCount: number;
  estimatedDays: number;
}

export const chapters: Chapter[] = [];

export function getChapterData(_chapterId: string) {
  // 所有章节数据均来自用户上传，无预置数据
  return { nodes: [], edges: [], path: [], title: '', total_pages: 0 } as any;
}
