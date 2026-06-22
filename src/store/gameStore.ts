import { create } from 'zustand';
import type {
  GameState, MemberCard, ProjectType, Phase, TurnResult,
  EventCard, EventEffect, ProjectResult,
} from '../types';
import { INITIAL_MEMBERS } from '../data/members';
import { PROJECT_CONFIGS } from '../data/projects';
import { EVENT_CARDS } from '../data/events';
import { drawPartners } from '../data/partners';

// ==========================================
// ユーティリティ
// ==========================================

const calcScore = (ratio: number): 'S' | 'A' | 'B' | 'C' | 'D' => {
  if (ratio >= 0.9) return 'S';
  if (ratio >= 0.75) return 'A';
  if (ratio >= 0.6) return 'B';
  if (ratio >= 0.4) return 'C';
  return 'D';
};

// スキル効率乗数（タスクの要求スキルと担当者のスキルレベルで工数効率が変わる）
export const calcSkillEfficiency = (
  member: MemberCard,
  requiredSkill: keyof MemberCard['skills'],
): number => {
  const level = member.skills[requiredSkill] ?? 0;
  if (level >= 4) return 1.3;   // 得意: +30%
  if (level >= 2) return 1.0;   // 普通: 等倍
  if (level >= 1) return 0.7;   // 不得意: -30%
  return 0.5;                    // 苦手: -50%
};

export const SKILL_NAMES: Record<keyof MemberCard['skills'], string> = {
  appTech: 'アプリ技術', infraTech: 'インフラ技術', dbTech: 'DB技術',
  security: 'セキュリティ', communication: 'コミュ力', documentation: '資料力',
  presentation: 'プレゼン力', partnerMgmt: 'パートナー管理', responsibility: '責任感',
};

const drawRandomEvent = (phases: Phase[], currentPhaseIndex: number, _guaranteedIds: string[]): EventCard | null => {
  const currentPhaseType = phases[currentPhaseIndex]?.type;
  if (!currentPhaseType) return null;

  // ポジティブイベント15%、重大イベント85%
  const pool = EVENT_CARDS.filter(e => {
    if (e.likelyPhases.includes(currentPhaseType)) return true;
    return false;
  });

  if (pool.length === 0) return null;

  // イベント発生確率 40%
  if (Math.random() > 0.4) return null;

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
};

const calcTotalSkill = (members: MemberCard[], skill: keyof MemberCard['skills']): number =>
  members.filter(m => m.isActive && !m.isBurnedOut).reduce((sum, m) => sum + m.skills[skill], 0);

// ==========================================
// Actions型
// ==========================================

interface GameActions {
  // ホーム
  selectProject: (type: ProjectType) => void;

  // メンバー編成
  toggleMemberSelection: (memberId: string) => void;
  confirmTeam: () => void;

  // プロジェクト進行
  handleEvent: (handle: boolean) => void;
  assignMemberToTask: (memberId: string, taskId: string | null) => void;
  assignPartnerToSe: (partnerId: string, seId: string | null) => void;
  confirmTurn: (bulkTurns?: number) => void;

  // コレクション
  goCollection: () => void;

  // ゲームオーバー/リザルト
  navigateToResult: () => void;
  goHome: () => void;

  // 内部メソッド
  _startEventPhase: () => void;
  _resolveTurn: () => void;
}

// ==========================================
// 初期状態
// ==========================================

const initialState: GameState = {
  screen: 'home',
  collection: INITIAL_MEMBERS,
  selectedProjectType: null,
  projectConfig: null,
  phases: [],
  currentPhaseIndex: 0,
  selectedMembers: [],
  partners: [],
  currentTurn: 1,
  maxTurns: 16,
  currentStep: 'event',
  assignment: { memberToTask: {}, partnerToSe: {} },
  currentEvent: null,
  eventHandled: false,
  unhandledEventCount: 0,
  bulkTurnsRemaining: 0,
  inefficientAssignmentCount: 0,
  isGameOver: false,
  gameOverReason: null,
  result: null,
  pendingResultNav: false,
};

// ==========================================
// Store
// ==========================================

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  // ----------------------------------------
  // プロジェクト選択
  // ----------------------------------------
  selectProject: (type) => {
    const config = PROJECT_CONFIGS.find(p => p.type === type);
    if (!config) return;
    set({
      selectedProjectType: type,
      projectConfig: config,
      screen: 'member_select',
      selectedMembers: [],
    });
  },

  // ----------------------------------------
  // メンバー選択
  // ----------------------------------------
  toggleMemberSelection: (memberId) => {
    const { selectedMembers, collection, projectConfig } = get();
    const budget = projectConfig?.budget ?? 100;
    const member = collection.find(m => m.id === memberId);
    if (!member) return;

    const isSelected = selectedMembers.some(m => m.id === memberId);
    if (isSelected) {
      set({ selectedMembers: selectedMembers.filter(m => m.id !== memberId) });
    } else {
      const currentCost = selectedMembers.reduce((sum, m) => sum + m.cost, 0);
      if (currentCost + member.cost <= budget) {
        set({ selectedMembers: [...selectedMembers, member] });
      }
    }
  },

  confirmTeam: () => {
    const { selectedMembers, projectConfig } = get();
    if (selectedMembers.length === 0 || !projectConfig) return;

    // フェーズを初期化
    const phases: Phase[] = projectConfig.phases.map(p => ({
      ...p,
      tasks: p.tasks.map(t => ({ ...t, completedWork: 0, assignedMemberIds: [] })),
      completedWork: 0,
      isCompleted: false,
    }));

    // パートナーをランダム抽選（SE人数に応じて）
    const seCount = selectedMembers.filter(m =>
      ['se', 'senior_se', 'junior_se', 'playing_pm'].includes(m.role)
    ).length;
    const partnerCount = Math.max(1, Math.min(seCount + 1, 4));
    const partners = drawPartners(partnerCount);

    // アサイン初期化
    const memberToTask: Record<string, string | null> = {};
    selectedMembers.forEach(m => { memberToTask[m.id] = null; });
    const partnerToSe: Record<string, string | null> = {};
    partners.forEach(p => { partnerToSe[p.id] = null; });

    set({
      screen: 'project',
      phases,
      currentPhaseIndex: 0,
      partners,
      currentTurn: 1,
      maxTurns: projectConfig.totalTurns,
      currentStep: 'event',
      assignment: { memberToTask, partnerToSe },
      currentEvent: null,
      eventHandled: false,
      unhandledEventCount: 0,
      isGameOver: false,
      gameOverReason: null,
      result: null,
    });

    // イベントフェーズを開始
    get()._startEventPhase();
  },

  // ----------------------------------------
  // イベントフェーズ開始（内部）
  // ----------------------------------------
  _startEventPhase: () => {
    const { phases, currentPhaseIndex, projectConfig, selectedMembers, currentTurn } = get();
    // ターン開始時: frozenUntilTurn を過ぎたメンバーを復帰させる
    const unfrozen = selectedMembers.map(m =>
      !m.isActive && m.frozenUntilTurn != null && m.frozenUntilTurn <= currentTurn
        ? { ...m, isActive: true, frozenUntilTurn: undefined }
        : m
    );
    const event = drawRandomEvent(
      phases, currentPhaseIndex,
      projectConfig?.guaranteedEventIds ?? []
    );
    set({ currentStep: 'event', currentEvent: event, eventHandled: false, selectedMembers: unfrozen });
  },

  // ----------------------------------------
  // イベント対処
  // ----------------------------------------
  handleEvent: (handle) => {
    const { currentEvent, selectedMembers, partners, phases, currentPhaseIndex,
            unhandledEventCount, currentTurn, maxTurns, assignment } = get();
    if (!currentEvent) {
      set({ currentStep: 'assign' });
      return;
    }

    let newUnhandled = unhandledEventCount;
    let newPartners = [...partners];
    let effectResult: EffectResult;

    if (handle && currentEvent.counterCondition && currentEvent.counterEffect) {
      const { skill, minValue } = currentEvent.counterCondition;
      const totalSkill = calcTotalSkill(selectedMembers, skill as keyof MemberCard['skills']);
      if (totalSkill >= minValue) {
        // 対処成功 → counterEffect 適用
        effectResult = applyEventEffect(
          currentEvent.counterEffect, currentEvent,
          phases, currentPhaseIndex, selectedMembers, currentTurn, maxTurns
        );
      } else {
        // スキル不足 → defaultEffect 適用
        effectResult = applyEventEffect(
          currentEvent.defaultEffect, currentEvent,
          phases, currentPhaseIndex, selectedMembers, currentTurn, maxTurns
        );
        newUnhandled++;
      }
    } else {
      // 受け入れる（またはポジティブイベント了解）
      effectResult = applyEventEffect(
        currentEvent.defaultEffect, currentEvent,
        phases, currentPhaseIndex, selectedMembers, currentTurn, maxTurns
      );
      if (currentEvent.category !== 'positive') newUnhandled++;
    }

    // パートナー全員離脱の特別処理
    if (currentEvent.id === 'ev_partner_contract_end' && !handle) {
      newPartners = [];
    }

    // フェーズロールバック時はアサインをリセット
    let newAssignment = assignment;
    if (effectResult.phaseIndex !== currentPhaseIndex) {
      const mt: Record<string, string | null> = {};
      effectResult.members.forEach(m => { mt[m.id] = null; });
      const ps: Record<string, string | null> = {};
      newPartners.forEach(p => { ps[p.id] = null; });
      newAssignment = { memberToTask: mt, partnerToSe: ps };
    }

    set({
      phases: effectResult.phases,
      selectedMembers: effectResult.members,
      partners: newPartners,
      maxTurns: effectResult.maxTurns,
      currentPhaseIndex: effectResult.phaseIndex,
      assignment: newAssignment,
      eventHandled: true,
      unhandledEventCount: newUnhandled,
      currentStep: 'assign',
    });
  },

  // ----------------------------------------
  // アサイン操作
  // ----------------------------------------
  assignMemberToTask: (memberId, taskId) => {
    const { assignment } = get();
    set({
      assignment: {
        ...assignment,
        memberToTask: { ...assignment.memberToTask, [memberId]: taskId },
      },
    });
  },

  assignPartnerToSe: (partnerId, seId) => {
    const { assignment } = get();
    set({
      assignment: {
        ...assignment,
        partnerToSe: { ...assignment.partnerToSe, [partnerId]: seId },
      },
    });
  },

  // ----------------------------------------
  // ターン確定・解決
  // ----------------------------------------
  confirmTurn: (bulkTurns = 1) => {
    set({ bulkTurnsRemaining: bulkTurns });
    get()._resolveTurn();
  },

  _resolveTurn: () => {
    const {
      phases, currentPhaseIndex, assignment, selectedMembers, partners,
      currentTurn, maxTurns, bulkTurnsRemaining, projectConfig,
    } = get();

    const result: TurnResult = {
      workAdded: {},
      staminaChanges: {},
      phasesCompleted: [],
      messages: [],
    };

    let newPhases = phases.map(p => ({
      ...p,
      tasks: p.tasks.map(t => ({ ...t })),
    }));

    const currentPhase = newPhases[currentPhaseIndex];
    if (!currentPhase || currentPhase.isCompleted) {
      set({ currentStep: 'event' });
      return;
    }

    // 各メンバーのアサインに基づいて工数を計算（スキル効率乗数込み）
    let newInefficient = 0;
    selectedMembers.forEach(member => {
      if (member.isBurnedOut || !member.isActive) return;
      const taskId = assignment.memberToTask[member.id];
      if (!taskId) return;

      const task = currentPhase.tasks.find(t => t.id === taskId);
      if (!task) return;

      const eff = calcSkillEfficiency(member, task.requiredSkill);
      const work = Math.round(member.workCapacity * eff);
      result.workAdded[taskId] = (result.workAdded[taskId] ?? 0) + work;

      if (eff < 1.0) newInefficient++;
    });

    // パートナーの工数を計算
    partners.forEach(partner => {
      const seId = assignment.partnerToSe[partner.id];
      if (!seId) return;

      const se = selectedMembers.find(m => m.id === seId);
      if (!se || !se.isActive) return;

      const seTaskId = assignment.memberToTask[seId];
      if (!seTaskId) return;

      result.workAdded[seTaskId] = (result.workAdded[seTaskId] ?? 0) + partner.workOutput;
    });

    // 工数をタスクに反映
    currentPhase.tasks.forEach(task => {
      const added = result.workAdded[task.id] ?? 0;
      task.completedWork = Math.min(task.completedWork + added, task.requiredWork);
    });

    // フェーズの完了工数を再計算
    currentPhase.completedWork = currentPhase.tasks.reduce((sum, t) => sum + t.completedWork, 0);

    // フェーズ完了チェック
    const allTasksDone = currentPhase.tasks.every(t => t.completedWork >= t.requiredWork);
    if (allTasksDone) {
      currentPhase.isCompleted = true;
      result.phasesCompleted.push(currentPhase.type);
    }

    // ターンを進める
    const nextTurn = currentTurn + 1;
    const nextPhaseIndex = allTasksDone ? currentPhaseIndex + 1 : currentPhaseIndex;
    const nextBulk = bulkTurnsRemaining - 1;

    const newInefficientTotal = get().inefficientAssignmentCount + newInefficient;

    // ゲームオーバーチェック
    if (nextTurn > maxTurns && nextPhaseIndex < newPhases.length) {
      const unfinished = newPhases.some(p => !p.isCompleted);
      if (unfinished) {
        set({
          phases: newPhases,
          currentTurn: nextTurn,
          inefficientAssignmentCount: newInefficientTotal,
          isGameOver: true,
          gameOverReason: 'turns_exhausted',
        });
        return;
      }
    }

    // 全フェーズ完了チェック
    if (nextPhaseIndex >= newPhases.length) {
      const stateWithInefficient = { ...get(), inefficientAssignmentCount: newInefficientTotal };
      const res = calcResult(stateWithInefficient);
      // screen 遷移はアニメーション完了後に行うため pendingResultNav フラグを立てる
      set({
        phases: newPhases,
        currentPhaseIndex: nextPhaseIndex,
        currentTurn: nextTurn,
        inefficientAssignmentCount: newInefficientTotal,
        result: res,
        pendingResultNav: true,
      });
      return;
    }

    set({
      phases: newPhases,
      currentPhaseIndex: nextPhaseIndex,
      currentTurn: nextTurn,
      bulkTurnsRemaining: nextBulk,
      inefficientAssignmentCount: newInefficientTotal,
    });

    // まとめて進める（続きがある場合は自動で次ターンへ）
    if (nextBulk > 0 && !allTasksDone) {
      // 自動停止条件をチェック
      const shouldStop = checkAutoStop(get());
      if (shouldStop) {
        set({ bulkTurnsRemaining: 0, currentStep: 'event' });
        get()._startEventPhase();
      } else {
        // イベントチェックしてから次ターン解決
        const event = drawRandomEvent(newPhases, nextPhaseIndex, projectConfig?.guaranteedEventIds ?? []);
        if (event) {
          set({ currentEvent: event, eventHandled: false, currentStep: 'event', bulkTurnsRemaining: nextBulk });
        } else {
          get()._resolveTurn();
        }
      }
    } else {
      set({ bulkTurnsRemaining: 0 });
      get()._startEventPhase();
    }
  },

  // ----------------------------------------
  // 全フェーズ完了後のリザルト遷移
  // ----------------------------------------
  navigateToResult: () => {
    set({ screen: 'result', pendingResultNav: false });
  },

  // ----------------------------------------
  // コレクション画面へ
  // ----------------------------------------
  goCollection: () => {
    set({ screen: 'collection' });
  },

  // ----------------------------------------
  // ホームへ戻る
  // ----------------------------------------
  goHome: () => {
    set({ ...initialState, collection: get().collection });
  },
}));

// ==========================================
// ヘルパー関数（store外）
// ==========================================

const addWorkToCurrentPhase = (phases: Phase[], idx: number, work: number): Phase[] => {
  return phases.map((p, i) => {
    if (i !== idx) return p;
    const firstTask = p.tasks[0];
    if (!firstTask) return p;
    return {
      ...p,
      tasks: p.tasks.map((t, ti) =>
        ti === 0 ? { ...t, requiredWork: t.requiredWork + work } : t
      ),
      totalWork: p.totalWork + work,
    };
  });
};

// イベントの対象メンバーを特定（最高Lv / 全員 etc.）
const resolveEventTargetMember = (event: EventCard, members: MemberCard[]): MemberCard | null => {
  const active = members.filter(m => m.isActive && !m.isBurnedOut);
  switch (event.id) {
    case 'ev_keyman_resign':
    case 'ev_forced_transfer':
      return [...active].sort((a, b) => b.level - a.level)[0] ?? null;
    default:
      return null;
  }
};

interface EffectResult {
  phases: Phase[];
  members: MemberCard[];
  maxTurns: number;
  phaseIndex: number;
}

const applyEventEffect = (
  effect: EventEffect,
  event: EventCard,
  phases: Phase[],
  phaseIndex: number,
  members: MemberCard[],
  currentTurn: number,
  maxTurns: number,
): EffectResult => {
  let newPhases = phases.map(p => ({ ...p, tasks: p.tasks.map(t => ({ ...t })) }));
  let newMembers = members.map(m => ({ ...m }));
  let newMaxTurns = maxTurns;
  let newIdx = phaseIndex;
  const target = resolveEventTargetMember(event, members);
  const active = members.filter(m => m.isActive && !m.isBurnedOut);

  switch (effect.type) {
    case 'add_work':
      if (effect.value !== 0) {
        newPhases = addWorkToCurrentPhase(newPhases, phaseIndex, effect.value);
      }
      break;

    case 'member_leave':
      if (target) {
        newMembers = newMembers.map(m =>
          m.id === target.id ? { ...m, isActive: false } : m
        );
      }
      // ev_partner_contract_end のパートナー離脱は handleEvent 側で処理
      break;

    case 'freeze_turns': {
      const unfreezeAt = currentTurn + effect.value;
      if (target) {
        // 特定メンバーを一時凍結
        newMembers = newMembers.map(m =>
          m.id === target.id
            ? { ...m, isActive: false, frozenUntilTurn: unfreezeAt }
            : m
        );
      } else {
        // 全アクティブメンバーを一時凍結（インフラ断・セキュリティ等）
        newMembers = newMembers.map(m =>
          m.isActive && !m.isBurnedOut
            ? { ...m, isActive: false, frozenUntilTurn: unfreezeAt }
            : m
        );
      }
      break;
    }

    case 'rollback_phase': {
      const targetIdx = Math.max(0, phaseIndex - effect.value);
      newPhases = newPhases.map((p, i) => {
        if (i < targetIdx || i > phaseIndex) return p;
        return {
          ...p,
          isCompleted: false,
          completedWork: 0,
          tasks: p.tasks.map(t => ({ ...t, completedWork: 0, assignedMemberIds: [] })),
        };
      });
      newIdx = targetIdx;
      break;
    }

    case 'reduce_turns':
      if (effect.value >= 10) {
        // パーセント指定（50 = 残りターンを50%削減）
        const remaining = maxTurns - currentTurn;
        newMaxTurns = Math.max(currentTurn + 2, maxTurns - Math.floor(remaining * (effect.value / 100)));
      } else {
        newMaxTurns = Math.max(currentTurn + 2, maxTurns - effect.value);
      }
      break;

    case 'stamina_damage':
      newMembers = newMembers.map(m => {
        if (!m.isActive || m.isBurnedOut) return m;
        const newStamina = Math.max(0, m.stamina - effect.value);
        return { ...m, stamina: newStamina, isBurnedOut: newStamina === 0, isActive: newStamina > 0 };
      });
      break;

    case 'bonus':
      // 全員稼働+N → 即時工数追加として近似
      newPhases = addWorkToCurrentPhase(newPhases, phaseIndex, active.length * effect.value);
      break;
  }

  return { phases: newPhases, members: newMembers, maxTurns: newMaxTurns, phaseIndex: newIdx };
};

const checkAutoStop = (state: GameState): boolean => {
  const { selectedMembers, currentTurn, maxTurns } = state;
  if (maxTurns - currentTurn <= 3) return true;
  const lowStamina = selectedMembers.some(m => m.stamina <= 1 && m.isActive);
  if (lowStamina) return true;
  return false;
};

const calcResult = (state: GameState): ProjectResult => {
  const { currentTurn, maxTurns, selectedMembers, projectConfig, unhandledEventCount, inefficientAssignmentCount } = state;
  const budgetUsed = selectedMembers.reduce((sum, m) => sum + m.cost, 0);
  const budget = projectConfig?.budget ?? 100;

  // 納期: 残りターン数が多いほど高評価。maxTurns*40%以上残ればS圏
  const turnsUsed = currentTurn - 1;
  const turnsRemaining = maxTurns - turnsUsed;
  const deadlineRatio = Math.min(1, turnsRemaining / (maxTurns * 0.4));
  const deadlineScore = calcScore(deadlineRatio);

  // コスト: 予算の60%未満の消費でA以上。90%以上でD
  const costRatio = Math.min(1, (budget - budgetUsed) / (budget * 0.5));
  const costScore = calcScore(costRatio);

  // 品質: 未対処イベント5件でD
  const qualityScore = calcScore(1 - Math.min(unhandledEventCount / 5, 1));

  const scores = [deadlineScore, costScore, qualityScore];
  const avg = scores.reduce((s, sc) => s + ['D','C','B','A','S'].indexOf(sc), 0) / 3;
  const overallScore = (['D','C','B','A','S'][Math.round(avg)] ?? 'C') as 'S'|'A'|'B'|'C'|'D';

  const expGained: Record<string, number> = {};
  selectedMembers.forEach(m => { expGained[m.id] = 100 + Math.floor(Math.random() * 200); });

  return {
    projectType: state.selectedProjectType!,
    turnsUsed,
    totalTurns: maxTurns,
    budgetUsed,
    budget,
    deadlineScore,
    costScore,
    qualityScore,
    overallScore,
    expGained,
    unhandledEventCount,
    inefficientAssignmentCount,
  };
};
