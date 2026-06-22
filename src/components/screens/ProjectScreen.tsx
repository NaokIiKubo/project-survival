import { useState, useEffect, useRef } from 'react';
import { useGameStore, calcSkillEfficiency, SKILL_NAMES } from '../../store/gameStore';
import { EventPopup } from '../EventPopup';
import { MemberDialogue } from '../MemberDialogue';
import { pickDialogue } from '../../data/dialogues';
import type { Task, MemberCard, PartnerCard, PhaseType, Phase } from '../../types';
import { PARTNER_TIER_LABELS, PARTNER_TIER_COLORS } from '../../data/partners';

// ==========================================
// 定数
// ==========================================

const PHASE_ICONS: Record<PhaseType, string> = {
  requirements: '📋', design: '✏️', development: '💻',
  testing: '🔍', release: '🚀',
};

// ==========================================
// 今ターンの予測工数計算
// ==========================================

const calcProjectedWork = (
  tasks: Task[],
  assignment: { memberToTask: Record<string, string | null>; partnerToSe: Record<string, string | null> },
  members: MemberCard[],
  partners: PartnerCard[],
): Record<string, number> => {
  const result: Record<string, number> = {};
  tasks.forEach(t => { result[t.id] = 0; });

  members.forEach(m => {
    if (m.isBurnedOut || !m.isActive) return;
    const taskId = assignment.memberToTask[m.id];
    if (!taskId || !(taskId in result)) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const eff = calcSkillEfficiency(m, task.requiredSkill);
    result[taskId] += Math.round(m.workCapacity * eff);
  });

  partners.forEach(p => {
    const seId = assignment.partnerToSe[p.id];
    if (!seId) return;
    const se = members.find(m => m.id === seId);
    if (!se || !se.isActive) return;
    const seTaskId = assignment.memberToTask[seId];
    if (seTaskId && seTaskId in result) result[seTaskId] += p.workOutput;
  });

  return result;
};

// ==========================================
// ターンアニメーション
// ==========================================

const STEP_MS = 300;

const TurnAnimation = ({
  turn, bulk, onComplete,
}: { turn: number; bulk: number; onComplete: () => void }) => {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (bulk === 1) {
      timers.push(setTimeout(() => setDone(true), 900));
      timers.push(setTimeout(onComplete, 1350));
    } else {
      // まとめて進行: 1ステップずつカウントアップ
      for (let i = 0; i < bulk; i++) {
        timers.push(setTimeout(() => setStep(i), i * STEP_MS + 80));
      }
      timers.push(setTimeout(() => setDone(true), bulk * STEP_MS + 80));
      timers.push(setTimeout(onComplete, bulk * STEP_MS + 580));
    }

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const displayTurn = turn + step + 1;
  const progressPct = bulk > 1 ? ((step + 1) / bulk) * 100 : (done ? 100 : 55);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,10,26,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 400,
    }}>
      <div style={{
        textAlign: 'center',
        animation: 'fadeInUp 0.25s ease-out',
        width: '100%', maxWidth: 260, padding: '0 24px',
      }}>

        {/* まとめてラベル */}
        {bulk > 1 && (
          <div style={{
            fontSize: 11, color: 'var(--blue-light)',
            letterSpacing: 2, marginBottom: 20,
            fontWeight: 'bold',
          }}>
            {bulk} ターンまとめて進行
          </div>
        )}

        {/* WEEK ラベル */}
        <div style={{
          fontSize: 11, color: 'var(--gray)',
          letterSpacing: 4, marginBottom: 2,
        }}>
          WEEK
        </div>

        {/* ターン数（キー変化でアニメーション再生） */}
        <div
          key={displayTurn}
          style={{
            fontSize: 88, fontWeight: 'bold', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            color: done ? 'var(--green)' : 'var(--white)',
            transition: 'color 0.25s',
            animation: 'numFlipIn 0.22s cubic-bezier(0.22,1,0.36,1)',
            display: 'inline-block',
          }}
        >
          {displayTurn}
        </div>

        {/* プログレスバー（まとめて進行のみ） */}
        {bulk > 1 && (
          <div style={{ margin: '18px 0 0' }}>
            <div style={{
              height: 3, background: 'rgba(255,255,255,0.08)',
              borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                background: done ? 'var(--green)' : 'var(--blue-light)',
                borderRadius: 2,
                transition: `width ${STEP_MS * 0.85}ms ease`,
              }} />
            </div>
          </div>
        )}

        {/* ステータステキスト */}
        <div style={{
          marginTop: 14, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done ? (
            <div style={{
              color: 'var(--green)', fontSize: 14, fontWeight: 'bold',
              animation: 'fadeInUp 0.2s ease',
            }}>
              ✓ {bulk > 1 ? `${bulk}ターン` : ''}完了
            </div>
          ) : bulk > 1 ? (
            <div style={{
              color: 'var(--gray)', fontSize: 12,
              animation: 'workPulse 0.65s infinite',
            }}>
              {step + 1} / {bulk} ターン処理中...
            </div>
          ) : (
            <div style={{
              color: 'var(--blue-light)', fontSize: 14,
              animation: 'workPulse 0.65s infinite',
            }}>
              ⚙ 作業中...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ==========================================
// フェーズ完了オーバーレイ
// ==========================================

const PhaseCompleteOverlay = ({
  completedPhase,
  nextPhase,
  onDismiss,
}: {
  completedPhase: Phase;
  nextPhase: Phase | null;
  onDismiss: () => void;
}) => (
  <div
    onClick={onDismiss}
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,10,26,0.93)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 350,
      cursor: 'pointer',
    }}
  >
    {/* 完了フェーズ */}
    <div style={{ textAlign: 'center', animation: 'phaseTextIn 0.4s ease-out' }}>
      <div style={{
        fontSize: 72, lineHeight: 1,
        animation: 'bounceIn 0.55s cubic-bezier(0.34,1.56,0.64,1)',
        display: 'inline-block',
      }}>
        {PHASE_ICONS[completedPhase.type]}
      </div>

      <div style={{
        marginTop: 16, fontSize: 11, letterSpacing: 3,
        color: 'var(--green)', fontWeight: 'bold',
        animation: 'phaseTextIn 0.4s 0.2s ease-out both',
      }}>
        PHASE COMPLETE
      </div>

      <div style={{
        fontSize: 26, fontWeight: 'bold', marginTop: 6,
        animation: 'phaseTextIn 0.4s 0.3s ease-out both',
        padding: '8px 24px', borderRadius: 10,
        border: '1px solid var(--green)',
      }}>
        {completedPhase.name} 完了！
      </div>
    </div>

    {/* 次フェーズ */}
    {nextPhase && (
      <div style={{
        marginTop: 32, textAlign: 'center',
        animation: 'phaseTextIn 0.4s 0.5s ease-out both',
      }}>
        <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 8, letterSpacing: 1 }}>
          NEXT PHASE
        </div>
        <div className="flex items-center gap-12" style={{ justifyContent: 'center' }}>
          <span style={{ fontSize: 28 }}>{PHASE_ICONS[nextPhase.type]}</span>
          <span style={{ fontSize: 18, color: 'var(--blue-light)', fontWeight: 'bold' }}>
            {nextPhase.name}
          </span>
        </div>
      </div>
    )}

    <div style={{ marginTop: 40, fontSize: 11, color: 'var(--gray-dark)' }}>
      タップして続ける
    </div>
  </div>
);

// ==========================================
// アサイン選択シート（ボトムシート）
// ==========================================

const AssignmentSheet = ({
  member, tasks, currentTaskId, onSelect, onClose,
}: {
  member: MemberCard;
  tasks: Task[];
  currentTaskId: string | null;
  onSelect: (taskId: string | null) => void;
  onClose: () => void;
}) => {
  const availableTasks = tasks.filter(t => t.completedWork < t.requiredWork);

  return (
    <div
      className="overlay"
      style={{ alignItems: 'flex-end', padding: 0, paddingBottom: 0 }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 430,
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          animation: 'slideUpSheet 0.22s ease-out',
          border: '1px solid var(--accent)', borderBottom: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ドラッグハンドル */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: 'var(--accent)', borderRadius: 2 }} />
        </div>

        {/* ヘッダー */}
        <div style={{ padding: '8px 20px 12px' }}>
          <div style={{ fontSize: 15, fontWeight: 'bold' }}>
            {member.role.includes('pm') ? '👔' : member.role === 'sales' ? '💼' : '💻'} {member.name}
          </div>
          <div className="text-small text-gray">稼働 {member.workCapacity}/ターン → どのタスクに割り当てる？</div>
        </div>

        <div className="divider" style={{ margin: 0 }} />

        {/* タスク一覧 */}
        {availableTasks.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray)' }}>
            全タスク完了済み
          </div>
        )}
        {availableTasks.map(task => {
          const pct = Math.min((task.completedWork / task.requiredWork) * 100, 100);
          const isSelected = task.id === currentTaskId;
          const eff = calcSkillEfficiency(member, task.requiredSkill);
          const effectiveWork = Math.round(member.workCapacity * eff);
          const skillLevel = member.skills[task.requiredSkill] ?? 0;
          const effInfo = eff >= 1.3
            ? { label: '得意', color: 'var(--green)', icon: '⬆' }
            : eff >= 1.0
            ? { label: '普通', color: 'var(--gray)', icon: '→' }
            : eff >= 0.7
            ? { label: '不得意', color: 'var(--yellow)', icon: '⬇' }
            : { label: '苦手', color: 'var(--highlight)', icon: '⬇⬇' };

          return (
            <div
              key={task.id}
              onClick={() => onSelect(task.id)}
              style={{
                padding: '10px 20px',
                borderBottom: '1px solid var(--accent)',
                cursor: 'pointer',
                background: isSelected ? 'rgba(93,173,232,0.1)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                <div className="flex items-center gap-8">
                  {isSelected && <span style={{ color: 'var(--blue-light)', fontSize: 11 }}>▶</span>}
                  <span style={{ fontSize: 14, fontWeight: 'bold' }}>{task.name}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--gray)' }}>{task.completedWork}/{task.requiredWork}</span>
              </div>
              {/* スキルマッチ表示 */}
              <div className="flex items-center gap-8" style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--gray)' }}>
                  {SKILL_NAMES[task.requiredSkill]}
                </span>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: 1,
                      background: i <= skillLevel ? effInfo.color : 'var(--accent)',
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 'bold', color: effInfo.color }}>
                  {effInfo.icon} {effInfo.label}
                </span>
                <span style={{ fontSize: 11, color: effInfo.color, marginLeft: 'auto' }}>
                  +{effectiveWork}工数
                  {eff !== 1.0 && (
                    <span style={{ fontSize: 10, color: 'var(--gray)' }}>
                      {' '}(×{eff})
                    </span>
                  )}
                </span>
              </div>
              <div className="progress-bar" style={{ height: 4 }}>
                <div className="progress-bar-fill" style={{
                  width: `${pct}%`,
                  background: pct > 70 ? 'var(--green)' : 'var(--blue-light)',
                }} />
              </div>
            </div>
          );
        })}

        {/* 解除 */}
        <div
          onClick={() => onSelect(null)}
          style={{ padding: '14px 20px', cursor: 'pointer', textAlign: 'center', color: 'var(--gray)' }}
        >
          アサイン解除
        </div>
      </div>
    </div>
  );
};

// ==========================================
// パートナー配置シート
// ==========================================

const PartnerSheet = ({
  partner, members, currentSeId, onSelect, onClose,
}: {
  partner: PartnerCard;
  members: MemberCard[];
  currentSeId: string | null;
  onSelect: (seId: string | null) => void;
  onClose: () => void;
}) => {
  const tierColor = PARTNER_TIER_COLORS[partner.tier];

  return (
    <div
      className="overlay"
      style={{ alignItems: 'flex-end', padding: 0 }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 430,
          animation: 'slideUpSheet 0.22s ease-out',
          border: `1px solid ${tierColor}55`, borderBottom: 'none',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: 'var(--accent)', borderRadius: 2 }} />
        </div>
        <div style={{ padding: '8px 20px 12px' }}>
          <div className="flex items-center gap-8">
            <span style={{ fontSize: 11, background: tierColor + '33', color: tierColor, padding: '2px 8px', borderRadius: 4 }}>
              {PARTNER_TIER_LABELS[partner.tier]}
            </span>
            <span style={{ fontSize: 15, fontWeight: 'bold' }}>{partner.name}</span>
            <span className="text-yellow text-bold">工数+{partner.workOutput}</span>
          </div>
          <div className="text-small text-gray" style={{ marginTop: 4 }}>担当する社員を選ぶ（担当SEのタスクに工数が加算される）</div>
        </div>
        <div className="divider" style={{ margin: 0 }} />
        {members.filter(m => m.isActive && !m.isBurnedOut).map(se => (
          <div
            key={se.id}
            onClick={() => onSelect(se.id)}
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--accent)',
              cursor: 'pointer',
              background: se.id === currentSeId ? 'rgba(93,173,232,0.12)' : 'transparent',
            }}
          >
            <div className="flex items-center gap-8">
              {se.id === currentSeId && <span style={{ color: 'var(--blue-light)', fontSize: 12 }}>▶</span>}
              <span>{se.role.includes('pm') ? '👔' : '💻'} {se.name}</span>
              <span className="text-small text-gray">{se.role}</span>
            </div>
          </div>
        ))}
        <div
          onClick={() => onSelect(null)}
          style={{ padding: '14px 20px', cursor: 'pointer', textAlign: 'center', color: 'var(--gray)' }}
        >
          割当解除
        </div>
      </div>
    </div>
  );
};

// ==========================================
// メインスクリーン
// ==========================================

export const ProjectScreen = () => {
  const {
    phases, currentPhaseIndex, selectedMembers, partners,
    currentTurn, maxTurns, currentStep, assignment,
    currentEvent, unhandledEventCount, isGameOver, gameOverReason, projectConfig,
    pendingResultNav,
    assignMemberToTask, assignPartnerToSe, confirmTurn, goHome, handleEvent, navigateToResult,
  } = useGameStore();

  const [bulkCount, setBulkCount] = useState(3);
  const [selectingMemberId, setSelectingMemberId] = useState<string | null>(null);
  const [selectingPartnerId, setSelectingPartnerId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animTurn, setAnimTurn] = useState(0);
  const [animBulk, setAnimBulk] = useState(1);
  const [currentDialogue, setCurrentDialogue] = useState<{ memberId: string; text: string } | null>(null);
  const prevStepRef = useRef(currentStep);
  const prevUnhandledRef = useRef(0);
  const pendingDialogueRef = useRef<{ memberId: string; text: string } | null>(null);

  // フェーズ完了オーバーレイ
  const [phaseCompleteInfo, setPhaseCompleteInfo] = useState<{
    completedPhase: Phase;
    nextPhase: Phase | null;
  } | null>(null);
  const prevPhaseIndexRef = useRef(currentPhaseIndex);

  // フェーズ変化を検出してオーバーレイ表示 + セリフ予約
  useEffect(() => {
    const prev = prevPhaseIndexRef.current;
    if (currentPhaseIndex > prev && currentPhaseIndex < phases.length) {
      const completedPhase = phases[prev];
      const nextPhase = phases[currentPhaseIndex] ?? null;
      if (completedPhase) {
        setPhaseCompleteInfo({ completedPhase, nextPhase });
        const activeMemberIds = selectedMembers.filter(m => m.isActive).map(m => m.id);
        pendingDialogueRef.current = pickDialogue(activeMemberIds, 'phase_complete');
      }
    }
    prevPhaseIndexRef.current = currentPhaseIndex;
  }, [currentPhaseIndex]);

  const handlePhaseOverlayDismiss = () => {
    setPhaseCompleteInfo(null);
    if (pendingDialogueRef.current) {
      setCurrentDialogue(pendingDialogueRef.current);
      pendingDialogueRef.current = null;
    }
  };

  // フェーズオーバーレイの自動消去（3秒）
  useEffect(() => {
    if (!phaseCompleteInfo) return;
    const timer = setTimeout(handlePhaseOverlayDismiss, 3000);
    return () => clearTimeout(timer);
  }, [phaseCompleteInfo]);

  // イベント処理後のセリフ
  useEffect(() => {
    if (prevStepRef.current === 'event' && currentStep === 'assign' && currentEvent) {
      const wasUnhandled = unhandledEventCount > prevUnhandledRef.current;
      const context = currentEvent.category === 'positive'
        ? 'event_positive' as const
        : wasUnhandled ? 'event_failed' as const : 'event_handled' as const;
      const activeMemberIds = selectedMembers.filter(m => m.isActive).map(m => m.id);
      const dialogue = pickDialogue(activeMemberIds, context);
      if (dialogue) setCurrentDialogue(dialogue);
    }
    prevStepRef.current = currentStep;
    prevUnhandledRef.current = unhandledEventCount;
  }, [currentStep, unhandledEventCount]);

  // イベントなし → 自動でアサインステップへ
  useEffect(() => {
    if (currentStep === 'event' && !currentEvent && !isGameOver && !isAnimating) {
      handleEvent(false);
    }
  }, [currentStep, currentEvent, isGameOver, isAnimating]);

  // 全フェーズ完了フラグを監視してアニメーション後に result 画面へ遷移
  useEffect(() => {
    if (pendingResultNav && !isAnimating) {
      navigateToResult();
    }
  }, [pendingResultNav, isAnimating]);

  // ターン進行（先に処理 → 実際の差分でアニメーション）
  const handleTurn = (bulk: number) => {
    setIsAnimating(true);               // 先にオーバーレイを立てる
    const fromTurn = currentTurn;
    confirmTurn(bulk);                  // Zustand 上で同期的に全ターン処理
    const { currentTurn: toTurn } = useGameStore.getState();
    const actualProcessed = toTurn - fromTurn;
    if (actualProcessed > 0) {
      setAnimTurn(fromTurn);
      setAnimBulk(actualProcessed);     // 実際に処理されたターン数でアニメーション
    } else {
      setIsAnimating(false);            // 処理ゼロの場合はアニメーション不要
    }
  };

  const onAnimationComplete = () => {
    setIsAnimating(false);
    // ターン処理は handleTurn 内で完了済み。result 遷移は useEffect が担当。
  };

  if (!phases[currentPhaseIndex] && !isGameOver) return null;
  const currentPhase = phases[currentPhaseIndex];
  const turnsLeft = maxTurns - currentTurn + 1;
  const turnPct = ((currentTurn - 1) / maxTurns) * 100;

  // ゲームオーバー
  if (isGameOver) {
    return (
      <div className="app-container">
        <div className="screen-header" style={{ background: 'var(--highlight)' }}>
          <h1>GAME OVER</h1>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💀</div>
          <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>プロジェクト失敗</div>
          <div style={{ color: 'var(--highlight)', fontSize: 15, marginBottom: 24 }}>
            {{
              turns_exhausted: '⏰ ターン使い切り',
              no_members: '👥 メンバー全員離脱',
              budget_exceeded: '💸 予算超過',
              security_failure: '🔒 セキュリティ事故',
            }[gameOverReason ?? 'turns_exhausted']}
          </div>
          <div className="text-gray" style={{ marginBottom: 32, textAlign: 'center', lineHeight: 1.8 }}>
            {currentTurn - 1}ターン目で力尽きました。<br />
            「{currentPhase?.name}」を完了できませんでした。
          </div>
          <button className="btn btn-danger btn-full" onClick={goHome}>
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  const phaseTotalWork = currentPhase.tasks.reduce((s, t) => s + t.requiredWork, 0);
  const phaseCompletedWork = currentPhase.tasks.reduce((s, t) => s + t.completedWork, 0);
  const phaseProgressPct = phaseTotalWork > 0 ? (phaseCompletedWork / phaseTotalWork) * 100 : 0;

  // 今ターンの予測工数
  const projectedWork = calcProjectedWork(currentPhase.tasks, assignment, selectedMembers, partners);
  const totalProjected = Object.values(projectedWork).reduce((s, v) => s + v, 0);

  return (
    <>
      {/* ターンアニメーション */}
      {isAnimating && (
        <TurnAnimation turn={animTurn} bulk={animBulk} onComplete={onAnimationComplete} />
      )}

      {/* フェーズ完了オーバーレイ（ターンアニメーション後に表示） */}
      {!isAnimating && phaseCompleteInfo && (
        <PhaseCompleteOverlay
          completedPhase={phaseCompleteInfo.completedPhase}
          nextPhase={phaseCompleteInfo.nextPhase}
          onDismiss={handlePhaseOverlayDismiss}
        />
      )}

      {/* イベントポップアップ */}
      {!isAnimating && !phaseCompleteInfo && currentStep === 'event' && currentEvent && (
        <EventPopup event={currentEvent} />
      )}

      {/* アサインシート */}
      {selectingMemberId && (() => {
        const member = selectedMembers.find(m => m.id === selectingMemberId);
        if (!member) return null;
        return (
          <AssignmentSheet
            member={member}
            tasks={currentPhase.tasks}
            currentTaskId={assignment.memberToTask[selectingMemberId] ?? null}
            onSelect={(taskId) => {
              assignMemberToTask(selectingMemberId, taskId);
              setSelectingMemberId(null);
            }}
            onClose={() => setSelectingMemberId(null)}
          />
        );
      })()}

      {/* メンバーセリフ */}
      {currentDialogue && !isAnimating && !phaseCompleteInfo && (
        <MemberDialogue
          memberId={currentDialogue.memberId}
          text={currentDialogue.text}
          members={selectedMembers}
          onDismiss={() => setCurrentDialogue(null)}
        />
      )}

      {/* パートナーシート */}
      {selectingPartnerId && (() => {
        const partner = partners.find(p => p.id === selectingPartnerId);
        if (!partner) return null;
        return (
          <PartnerSheet
            partner={partner}
            members={selectedMembers}
            currentSeId={assignment.partnerToSe[selectingPartnerId] ?? null}
            onSelect={(seId) => {
              assignPartnerToSe(selectingPartnerId, seId);
              setSelectingPartnerId(null);
            }}
            onClose={() => setSelectingPartnerId(null)}
          />
        );
      })()}

      <div className="app-container">

        {/* ━━━ ヘッダー（固定） ━━━ */}
        <div className="screen-header" style={{ flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: 'var(--gray)' }}>
                {projectConfig?.name}
              </span>
              <div className="flex items-center gap-8">
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>Week {currentTurn}/{maxTurns}</span>
                <span className={`text-bold ${turnsLeft <= 3 ? 'text-red' : 'text-yellow'}`} style={{ fontSize: 13 }}>
                  残{turnsLeft}T
                </span>
              </div>
            </div>
            <div className="progress-bar" style={{ height: 4 }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${turnPct}%`,
                  background: turnsLeft <= 3 ? 'var(--highlight)' : 'var(--yellow)',
                  transition: 'width 0.5s',
                }}
              />
            </div>
          </div>
        </div>

        {/* ━━━ 上パネル：フェーズ進捗 + タスク（固定、最大45vh） ━━━ */}
        <div
          className="panel-scroll"
          style={{
            flexShrink: 0,
            maxHeight: '44vh',
            background: 'var(--bg-card)',
            borderBottom: '2px solid var(--accent)',
            padding: '10px 12px 12px',
          }}
        >
          {/* フェーズチップ */}
          <div className="flex gap-4" style={{ marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {phases.map((p, i) => (
              <div
                key={p.type}
                style={{
                  flexShrink: 0, minWidth: 50, padding: '4px 6px',
                  borderRadius: 6, textAlign: 'center', fontSize: 10, fontWeight: 'bold',
                  background: p.isCompleted ? 'var(--green)' : i === currentPhaseIndex ? 'var(--blue-light)' : 'var(--accent)',
                  color: (p.isCompleted || i === currentPhaseIndex) ? '#000' : 'var(--gray)',
                }}
              >
                {PHASE_ICONS[p.type]}<br />{p.name}
              </div>
            ))}
          </div>

          {/* 現フェーズ名 + 大きい進捗バー */}
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>
              {PHASE_ICONS[currentPhase.type]} {currentPhase.name}
            </span>
            <span className="text-small text-gray">{phaseCompletedWork} / {phaseTotalWork}</span>
          </div>
          <div className="progress-bar" style={{ height: 10, marginBottom: 10 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${phaseProgressPct}%`,
                background: phaseProgressPct >= 90 ? 'var(--green)' : phaseProgressPct >= 50 ? 'var(--blue-light)' : 'var(--yellow)',
                transition: 'width 0.5s',
              }}
            />
          </div>

          {/* タスクバー（予測工数プレビュー付き） */}
          {currentPhase.tasks.map(task => {
            const done = task.completedWork >= task.requiredWork;
            const taskPct = Math.min((task.completedWork / task.requiredWork) * 100, 100);
            const projected = projectedWork[task.id] ?? 0;
            const willComplete = !done && task.completedWork + projected >= task.requiredWork;
            // ゴースト表示幅：現在から+projected分、バー幅100%を超えないように
            const ghostWidth = Math.min((projected / task.requiredWork) * 100, 100 - taskPct);

            return (
              <div
                key={task.id}
                style={{
                  marginBottom: 6, padding: '6px 8px',
                  background: done ? 'rgba(46,204,113,0.08)' : 'var(--accent)',
                  borderRadius: 6,
                  border: `1px solid ${done ? 'var(--green)' : projected > 0 ? 'var(--blue-light)' : 'var(--accent)'}`,
                  opacity: done ? 0.6 : 1,
                  transition: 'border-color 0.2s',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <div className="flex items-center gap-8">
                    <span style={{ fontSize: 12 }}>
                      {done ? '✅' : projected > 0 ? '⚡' : '○'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 'bold' }}>{task.name}</span>
                  </div>
                  <div className="flex items-center gap-8">
                    {/* 今ターンの増加量バッジ */}
                    {projected > 0 && !done && (
                      <span style={{
                        fontSize: 11, fontWeight: 'bold',
                        background: willComplete ? 'rgba(46,204,113,0.2)' : 'rgba(245,166,35,0.2)',
                        color: willComplete ? 'var(--green)' : 'var(--yellow)',
                        padding: '1px 6px', borderRadius: 4,
                      }}>
                        +{projected}
                      </span>
                    )}
                    {willComplete && (
                      <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 'bold' }}>
                        今T完了！
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--gray)' }}>
                      {task.completedWork}/{task.requiredWork}
                    </span>
                  </div>
                </div>
                {/* プログレスバー：現在値 + ゴースト（今ターン分） */}
                <div className="progress-bar" style={{ height: 6, position: 'relative' }}>
                  {/* ゴースト：今ターン増加分（黄色/緑） */}
                  {projected > 0 && !done && (
                    <div style={{
                      position: 'absolute',
                      left: `${taskPct}%`,
                      width: `${ghostWidth}%`,
                      height: '100%',
                      background: willComplete ? 'var(--green)' : 'var(--yellow)',
                      opacity: 0.5,
                      borderRadius: 4,
                      transition: 'width 0.3s',
                    }} />
                  )}
                  {/* 現在の進捗 */}
                  <div style={{
                    height: '100%',
                    width: `${taskPct}%`,
                    background: done ? 'var(--green)' : projected > 0 ? 'var(--blue-light)' : 'var(--gray-dark)',
                    borderRadius: 4,
                    transition: 'width 0.5s',
                    position: 'relative',
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ━━━ 下パネル：アサイン設定（独立スクロール） ━━━ */}
        <div
          className="panel-scroll"
          style={{ flex: 1, minHeight: 0, padding: '10px 12px' }}
        >
          <div className="section-title">メンバー配置</div>

          {selectedMembers.map(member => {
            const taskId = assignment.memberToTask[member.id] ?? null;
            const task = currentPhase.tasks.find(t => t.id === taskId);
            const isAssigned = !!task && task.completedWork < task.requiredWork;

            // このメンバーの今ターン貢献工数（スキル効率込み + 担当パートナー）
            const eff = isAssigned && task ? calcSkillEfficiency(member, task.requiredSkill) : 1.0;
            const memberWork = isAssigned ? Math.round(member.workCapacity * eff) : 0;
            const partnerBonus = partners
              .filter(p => assignment.partnerToSe[p.id] === member.id)
              .reduce((s, p) => s + p.workOutput, 0);
            const totalContrib = memberWork + (isAssigned ? partnerBonus : 0);
            const effBadge = eff >= 1.3
              ? { text: '得意⬆', color: 'var(--green)' }
              : eff >= 1.0 ? null
              : eff >= 0.7
              ? { text: '不得意⬇', color: 'var(--yellow)' }
              : { text: '苦手⬇⬇', color: 'var(--highlight)' };

            return (
              <div
                key={member.id}
                onClick={() => setSelectingMemberId(member.id)}
                className="card"
                style={{ cursor: 'pointer', padding: '10px 12px', marginBottom: 8 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-8">
                    <span style={{ fontSize: 18 }}>
                      {member.role.includes('pm') ? '👔' : member.role === 'sales' ? '💼' : '💻'}
                    </span>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 'bold' }}>{member.name}</span>
                      <span className="text-small text-gray" style={{ marginLeft: 6 }}>稼働{member.workCapacity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    {/* 今ターンの貢献工数 + 効率バッジ */}
                    {totalContrib > 0 && (
                      <div className="flex items-center gap-4">
                        {effBadge && (
                          <span style={{
                            fontSize: 10, color: effBadge.color,
                            background: effBadge.color + '22',
                            padding: '1px 5px', borderRadius: 3,
                          }}>
                            {effBadge.text}
                          </span>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 'bold', color: eff < 1 ? 'var(--yellow)' : 'var(--white)' }}>
                          +{totalContrib}
                        </span>
                      </div>
                    )}
                    {isAssigned ? (
                      <span style={{
                        fontSize: 11, background: 'rgba(93,173,232,0.15)',
                        color: 'var(--blue-light)', padding: '2px 8px', borderRadius: 4,
                      }}>
                        {task!.name}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 11, background: 'rgba(233,79,55,0.12)',
                        color: 'var(--highlight)', padding: '2px 8px', borderRadius: 4,
                      }}>
                        未アサイン
                      </span>
                    )}
                    <span style={{ color: 'var(--gray)', fontSize: 12 }}>▶</span>
                  </div>
                </div>
              </div>
            );
          })}

          {partners.length > 0 && (
            <>
              <div className="section-title mt-12">パートナー配置</div>
              {partners.map(partner => {
                const seId = assignment.partnerToSe[partner.id] ?? null;
                const se = selectedMembers.find(m => m.id === seId);
                const tierColor = PARTNER_TIER_COLORS[partner.tier];

                return (
                  <div
                    key={partner.id}
                    onClick={() => setSelectingPartnerId(partner.id)}
                    className="card"
                    style={{
                      cursor: 'pointer', padding: '10px 12px', marginBottom: 8,
                      borderColor: tierColor + '55',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-8">
                        <span style={{
                          fontSize: 10, background: tierColor + '33',
                          color: tierColor, padding: '2px 6px', borderRadius: 4,
                        }}>
                          {PARTNER_TIER_LABELS[partner.tier]}
                        </span>
                        <span style={{ fontSize: 13 }}>{partner.name}</span>
                        <span className="text-yellow" style={{ fontSize: 12 }}>+{partner.workOutput}</span>
                      </div>
                      <div className="flex items-center gap-8">
                        {se ? (
                          <span style={{
                            fontSize: 11, background: 'rgba(93,173,232,0.15)',
                            color: 'var(--blue-light)', padding: '2px 8px', borderRadius: 4,
                          }}>
                            {se.name}担当
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 11, color: 'var(--gray-dark)', padding: '2px 8px',
                          }}>
                            未割当
                          </span>
                        )}
                        <span style={{ color: 'var(--gray)', fontSize: 12 }}>▶</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <div style={{ height: 16 }} />
        </div>

        {/* ━━━ 下部コントロール（固定） ━━━ */}
        {currentStep === 'assign' && (
          <div style={{
            flexShrink: 0,
            padding: '10px 12px',
            borderTop: '2px solid var(--accent)',
            background: 'var(--bg-dark)',
          }}>
            {/* 今ターン工数サマリー */}
            {totalProjected > 0 ? (
              <div style={{
                marginBottom: 8, padding: '5px 10px',
                background: 'var(--accent)', borderRadius: 6,
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 10, color: 'var(--gray)' }}>今ターン:</span>
                {currentPhase.tasks.map(task => {
                  const p = projectedWork[task.id] ?? 0;
                  if (p === 0) return null;
                  const willComplete = task.completedWork + p >= task.requiredWork;
                  return (
                    <span key={task.id} style={{
                      fontSize: 11,
                      color: willComplete ? 'var(--green)' : 'var(--yellow)',
                      fontWeight: 'bold',
                    }}>
                      {task.name} +{p}{willComplete ? '✓' : ''}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div style={{
                marginBottom: 8, padding: '5px 10px',
                background: 'rgba(233,79,55,0.1)', borderRadius: 6,
                fontSize: 11, color: 'var(--highlight)',
              }}>
                ⚠ 誰もアサインされていません（工数0）
              </div>
            )}
            <div className="flex gap-8 items-center">
              {/* まとめて進める カウンター */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--accent)', borderRadius: 8, padding: '6px 10px',
              }}>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 16, padding: '0 2px' }}
                  onClick={() => setBulkCount(c => Math.max(1, c - 1))}
                >−</button>
                <span style={{ color: 'var(--yellow)', fontWeight: 'bold', minWidth: 24, textAlign: 'center' }}>
                  {bulkCount}T
                </span>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 16, padding: '0 2px' }}
                  onClick={() => setBulkCount(c => Math.min(turnsLeft, c + 1))}
                >+</button>
              </div>

              {/* まとめて進める ボタン */}
              {bulkCount > 1 && (
                <button
                  className="btn btn-warning"
                  style={{ flex: 1 }}
                  onClick={() => handleTurn(bulkCount)}
                >
                  まとめて{bulkCount}T進める
                </button>
              )}

              {/* 1ターン進める ボタン */}
              <button
                className="btn btn-primary"
                style={{ flex: bulkCount <= 1 ? 1 : 'none', minWidth: 80 }}
                onClick={() => handleTurn(1)}
              >
                1T進める →
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
};
