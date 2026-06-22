import { useGameStore } from '../../store/gameStore';
import type { ProjectResult } from '../../types';

const SCORE_COLORS: Record<string, string> = {
  S: '#FFD700', A: 'var(--green)', B: 'var(--blue-light)',
  C: 'var(--yellow)', D: 'var(--highlight)',
};

const SCORE_MESSAGES: Record<string, string> = {
  S: '完璧な仕事！', A: 'よくできました', B: '及第点', C: 'ギリギリ', D: '要改善',
};

const ScoreBox = ({ label, score }: { label: string; score: string }) => (
  <div style={{
    background: 'var(--accent)', borderRadius: 10,
    padding: '12px 8px', textAlign: 'center', flex: 1,
    border: `1px solid ${SCORE_COLORS[score] ?? 'var(--accent)'}`,
  }}>
    <div className="text-small text-gray" style={{ marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 'bold', color: SCORE_COLORS[score] ?? 'var(--white)' }}>
      {score}
    </div>
  </div>
);

// ==========================================
// 振り返りの根拠生成
// ==========================================

interface Insight {
  score: string;
  label: string;
  causes: string[];
  hint: string;
}

const generateInsights = (result: ProjectResult): Insight[] => {
  const insights: Insight[] = [];
  const { deadlineScore, costScore, qualityScore,
          turnsUsed, totalTurns, budgetUsed, budget,
          unhandledEventCount, inefficientAssignmentCount } = result;

  // 納期
  const turnsRemaining = totalTurns - turnsUsed;
  const turnRemainingPct = Math.round((turnsRemaining / totalTurns) * 100);
  if (deadlineScore !== 'S' && deadlineScore !== 'A') {
    const causes: string[] = [];
    causes.push(`${totalTurns}ターン中 ${turnsUsed}ターン使用（残り${turnsRemaining}T = ${turnRemainingPct}%）`);
    if (inefficientAssignmentCount >= 5) {
      causes.push(`適性外アサインが ${inefficientAssignmentCount} 回あり、工数が最大50%減少していた可能性があります`);
    } else if (inefficientAssignmentCount > 0) {
      causes.push(`${inefficientAssignmentCount} 回のアサインでスキルが合わず工数ロスが発生`);
    }
    insights.push({
      score: deadlineScore,
      label: '⏱ 納期',
      causes,
      hint: 'タスクの「必須スキル」に合ったメンバーを配置すると工数効率が最大+30%改善。残り40%以上のターンでAを狙えます。',
    });
  }

  // コスト
  const costPct = Math.round((budgetUsed / budget) * 100);
  const savedPct = 100 - costPct;
  if (costScore !== 'S' && costScore !== 'A') {
    const causes: string[] = [];
    causes.push(`予算${budget}ptのうち${budgetUsed}pt（${costPct}%）を消費`);
    if (costPct >= 90) {
      causes.push('高コストメンバーを多く起用したため、予算をほぼ使い切りました');
    } else if (costPct >= 75) {
      causes.push('コスト削減の余地があります。低コストメンバーとの組み合わせを検討してみてください');
    }
    insights.push({
      score: costScore,
      label: '💴 コスト',
      causes,
      hint: `節約できたのは${savedPct}pt。50%以下の消費でSを狙えます。コスト0のミヤザキさんや低コストメンバーを活用しましょう。`,
    });
  }

  // 品質
  if (qualityScore !== 'S' && qualityScore !== 'A') {
    const causes: string[] = [];
    causes.push(`イベント${unhandledEventCount}件を未対処または対処スキル不足で受け入れ`);
    if (unhandledEventCount >= 3) {
      causes.push('イベント対処スキル（コミュ力・責任感・技術スキル）が不足していました');
    }
    insights.push({
      score: qualityScore,
      label: '🔧 品質',
      causes,
      hint: 'ハヤシさん（責任感5）やヨシダさん（コミュ力5）をチームに入れるとイベント対処率が上がります。',
    });
  }

  return insights;
};

// ==========================================
// コンポーネント
// ==========================================

export const ResultScreen = () => {
  const { result, selectedMembers, goHome } = useGameStore();

  if (!result) return null;

  const overallColor = SCORE_COLORS[result.overallScore] ?? 'var(--white)';
  const insights = generateInsights(result);
  const turnsRemaining = result.totalTurns - result.turnsUsed;
  const costPct = Math.round((result.budgetUsed / result.budget) * 100);

  return (
    <div className="app-container">
      <div className="screen-header">
        <h1>🏁 プロジェクト終了</h1>
      </div>

      <div className="panel-scroll" style={{ flex: 1, minHeight: 0, padding: '12px' }}>

        {/* 総合スコア */}
        <div className="card" style={{
          textAlign: 'center', padding: '20px 12px',
          border: `2px solid ${overallColor}`,
        }}>
          <div className="text-small text-gray" style={{ marginBottom: 8 }}>総合評価</div>
          <div style={{ fontSize: 72, fontWeight: 'bold', color: overallColor, lineHeight: 1 }}>
            {result.overallScore}
          </div>
          <div style={{ fontSize: 15, marginTop: 8, color: 'var(--gray)' }}>
            {SCORE_MESSAGES[result.overallScore]}
          </div>
        </div>

        {/* スコア内訳 */}
        <div className="flex gap-8" style={{ margin: '10px 0' }}>
          <ScoreBox label="納期" score={result.deadlineScore} />
          <ScoreBox label="コスト" score={result.costScore} />
          <ScoreBox label="品質" score={result.qualityScore} />
        </div>

        {/* プロジェクト数値 */}
        <div className="card">
          <div className="section-title">実績数値</div>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: '8px', background: 'var(--accent)', borderRadius: 6 }}>
              <div className="text-small text-gray">使用ターン</div>
              <div className="text-bold" style={{ fontSize: 16 }}>
                {result.turnsUsed}<span className="text-gray text-small">/{result.totalTurns}</span>
              </div>
              <div style={{ fontSize: 10, color: turnsRemaining >= result.totalTurns * 0.4 ? 'var(--green)' : turnsRemaining >= result.totalTurns * 0.2 ? 'var(--yellow)' : 'var(--highlight)' }}>
                残{turnsRemaining}T
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: '8px', background: 'var(--accent)', borderRadius: 6 }}>
              <div className="text-small text-gray">コスト消費</div>
              <div className="text-bold" style={{ fontSize: 16 }}>
                {result.budgetUsed}<span className="text-gray text-small">/{result.budget}pt</span>
              </div>
              <div style={{ fontSize: 10, color: costPct <= 50 ? 'var(--green)' : costPct <= 70 ? 'var(--yellow)' : 'var(--highlight)' }}>
                {costPct}%消費
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 100, textAlign: 'center', padding: '8px', background: 'var(--accent)', borderRadius: 6 }}>
              <div className="text-small text-gray">未対処イベント</div>
              <div className="text-bold" style={{ fontSize: 16 }}>
                {result.unhandledEventCount}<span className="text-gray text-small">件</span>
              </div>
              {result.inefficientAssignmentCount > 0 && (
                <div style={{ fontSize: 10, color: 'var(--yellow)' }}>
                  非適性{result.inefficientAssignmentCount}回
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 振り返り（課題があるスコアのみ） */}
        {insights.length > 0 && (
          <div className="card" style={{ marginTop: 10 }}>
            <div className="section-title">振り返り</div>
            {insights.map((insight, idx) => (
              <div key={idx} style={{ marginBottom: idx < insights.length - 1 ? 14 : 0 }}>
                <div className="flex items-center gap-8" style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 'bold' }}>{insight.label}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 'bold',
                    color: SCORE_COLORS[insight.score],
                    background: SCORE_COLORS[insight.score] + '22',
                    padding: '1px 6px', borderRadius: 4,
                  }}>
                    {insight.score}評価
                  </span>
                </div>

                {/* 原因 */}
                <div style={{ background: 'rgba(233,79,55,0.08)', borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
                  {insight.causes.map((c, i) => (
                    <div key={i} className="text-small" style={{ color: 'var(--gray)', lineHeight: 1.6 }}>
                      • {c}
                    </div>
                  ))}
                </div>

                {/* 改善ヒント */}
                <div style={{ background: 'rgba(93,173,232,0.08)', borderRadius: 6, padding: '8px 10px', borderLeft: '2px solid var(--blue-light)' }}>
                  <div style={{ fontSize: 10, color: 'var(--blue-light)', marginBottom: 3 }}>💡 次回のヒント</div>
                  <div className="text-small" style={{ color: 'var(--gray)', lineHeight: 1.6 }}>
                    {insight.hint}
                  </div>
                </div>

                {idx < insights.length - 1 && <div className="divider" style={{ marginTop: 14 }} />}
              </div>
            ))}
          </div>
        )}

        {/* メンバー成長 */}
        <div className="card" style={{ marginTop: 10 }}>
          <div className="section-title">メンバー成長</div>
          {selectedMembers.map(member => {
            const exp = result.expGained[member.id] ?? 0;
            return (
              <div key={member.id}
                className="flex items-center justify-between"
                style={{ padding: '6px 0', borderBottom: '1px solid var(--accent)' }}
              >
                <div className="flex items-center gap-8">
                  <span>{member.role.includes('pm') ? '👔' : member.role === 'sales' ? '💼' : '💻'}</span>
                  <span style={{ fontSize: 13 }}>{member.name}</span>
                  <span className="text-small text-gray">Lv{member.level}</span>
                </div>
                <span className="text-yellow text-bold">+{exp} EXP</span>
              </div>
            );
          })}
          <div className="text-small text-gray" style={{ marginTop: 8, textAlign: 'center' }}>
            ※ 年次+1（コレクション全員）
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid var(--accent)', flexShrink: 0 }}>
        <button className="btn btn-primary btn-full" onClick={goHome}>
          ホームへ戻る
        </button>
      </div>
    </div>
  );
};
