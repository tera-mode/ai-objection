import fs from 'fs';
import path from 'path';
import { CaseData } from '@/types/game';

const CASES_DIR = path.join(process.cwd(), 'data', 'cases');

/**
 * サーバーサイドのみで使用。クライアントには絶対に公開しないこと。
 */
export function loadCase(caseId: string): CaseData {
  const filePath = path.join(CASES_DIR, `${caseId}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as CaseData;
}

export function listCases(): { id: string; title: string; difficulty: string }[] {
  if (!fs.existsSync(CASES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CASES_DIR).filter((f) => f.endsWith('.json'));

  return files.map((file) => {
    const filePath = path.join(CASES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as CaseData;
    return {
      id: data.id,
      title: data.title,
      difficulty: data.difficulty,
    };
  });
}
