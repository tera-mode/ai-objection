import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';
import fs from 'fs';
import path from 'path';

interface StoryFlowItem {
  type: 'event' | 'case';
  id: string;
  title: string;
  card?: {
    characterImage: string;
    backgroundImage: string;
  } | null;
}

interface StoryFlowJson {
  items: StoryFlowItem[];
}

interface CaseJson {
  id: string;
  title: string;
  difficulty: string;
  description: string;
}

interface CaseSummary {
  id: string;
  title: string;
  difficulty: string;
  description: string;
}

export interface StoryFlowResponseItem {
  type: 'event' | 'case';
  id: string;
  title: string;
  difficulty?: string;
  description?: string;
  card?: {
    characterImage: string;
    backgroundImage: string;
  } | null;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const flowPath = path.join(process.cwd(), 'data', 'story-flow.json');
    const casesDir = path.join(process.cwd(), 'data', 'cases');

    const flowJson = JSON.parse(fs.readFileSync(flowPath, 'utf-8')) as StoryFlowJson;

    const items: StoryFlowResponseItem[] = flowJson.items.map((item) => {
      if (item.type === 'case') {
        const casePath = path.join(casesDir, `${item.id}.json`);
        if (fs.existsSync(casePath)) {
          const caseData = JSON.parse(fs.readFileSync(casePath, 'utf-8')) as CaseJson;
          return {
            type: 'case' as const,
            id: item.id,
            title: caseData.title,
            difficulty: caseData.difficulty,
            description: caseData.description,
            card: item.card ?? null,
          };
        }
      }
      return {
        type: item.type,
        id: item.id,
        title: item.title,
        card: item.card ?? null,
      };
    });

    // サンプルケース一覧
    const sampleCases: CaseSummary[] = [];
    if (fs.existsSync(casesDir)) {
      const files = fs.readdirSync(casesDir).filter((f) => f.endsWith('.json'));
      files.forEach((file) => {
        const caseData = JSON.parse(
          fs.readFileSync(path.join(casesDir, file), 'utf-8')
        ) as CaseJson;
        if (caseData.id.startsWith('case_sample')) {
          sampleCases.push({
            id: caseData.id,
            title: caseData.title,
            difficulty: caseData.difficulty,
            description: caseData.description,
          });
        }
      });
    }

    return NextResponse.json({ items, sampleCases });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
