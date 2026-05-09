import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const prompt = `당신은 할 일 난이도 분류 전문가입니다. 다음 할 일의 난이도를 아래 3가지 중 하나의 단어로만 답하세요. 다른 말은 절대 하지 마세요.

난이도 기준:
- 쉬움: 5분~30분 안에 완료 가능하거나 특별한 기술/지식 없이 누구나 할 수 있는 것 (예: 물 마시기, 세수하기, 메모 남기기)
- 중간: 30분~2시간 걸리거나 약간의 집중력이나 기술이 필요한 것 (예: 보고서 초안 작성, 운동 1시간)
- 어려움: 2시간 이상 걸리거나 전문 지식/높은 집중력/복잡한 작업인 것 (예: 논문 작성, 새로운 언어 학습, 복잡한 프로젝트)

할 일: ${content}

답변 (쉬움/중간/어려움 중 하나만):`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 20,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error?.message || 'Gemini API error';
      console.error('Gemini error:', errMsg);
      // Return 중간 as fallback so the app doesn't break
      return NextResponse.json({ difficulty: '중간', error: errMsg });
    }

    const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log('Gemini raw response:', rawText);

    let finalDifficulty = '중간';
    if (rawText.includes('어려움')) {
      finalDifficulty = '어려움';
    } else if (rawText.includes('쉬움')) {
      finalDifficulty = '쉬움';
    } else if (rawText.includes('중간')) {
      finalDifficulty = '중간';
    }

    return NextResponse.json({ difficulty: finalDifficulty });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Categorize API error:', message);
    return NextResponse.json({ difficulty: '중간', error: message }, { status: 500 });
  }
}
