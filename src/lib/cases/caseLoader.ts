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

type CaseSummary = { id: string; title: string; difficulty: string; description: string };

export function listCases(): { cases: CaseSummary[]; sampleCases: CaseSummary[] } {
  if (!fs.existsSync(CASES_DIR)) {
    return { cases: [], sampleCases: [] };
  }

  const files = fs.readdirSync(CASES_DIR).filter((f) => f.endsWith('.json'));
  const cases: CaseSummary[] = [];
  const sampleCases: CaseSummary[] = [];

  files.forEach((file) => {
    const filePath = path.join(CASES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as CaseData;
    const summary = { id: data.id, title: data.title, difficulty: data.difficulty, description: data.description };
    if (data.id.startsWith('case_sample')) {
      sampleCases.push(summary);
    } else if (!data.id.startsWith('mini_')) {
      // mini_* ケースはイベントフロー専用。通常リストには表示しない
      cases.push(summary);
    }
  });

  return { cases, sampleCases };
}
