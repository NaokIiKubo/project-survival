// ==========================================
// 役職
// ==========================================
export type Role = 'junior_se' | 'se' | 'senior_se' | 'pm' | 'playing_pm' | 'sales';

// ==========================================
// メンバーカード
// ==========================================
export interface MemberSkills {
  appTech: number;       // アプリ技術力
  infraTech: number;     // インフラ技術力
  dbTech: number;        // DB技術力
  security: number;      // セキュリティ知識
  communication: number; // コミュ力
  documentation: number; // 資料力
  presentation: number;  // プレゼン力
  partnerMgmt: number;   // パートナー管理
  responsibility: number;// 責任感
}

export interface SpecialSkill {
  id: string;
  name: string;
  description: string;
  // 発動条件
  trigger: 'manual' | 'auto_event' | 'auto_condition';
  // 使用済みフラグ（プロジェクト内）
  used?: boolean;
}

export interface MemberCard {
  id: string;
  name: string;
  role: Role;
  seniority: number;      // 年次（プロジェクト完了ごとに+1）
  level: number;          // レベル（活躍で上昇）
  exp: number;            // 現在の経験値
  cost: number;           // コスト（予算消費）
  workCapacity: number;   // 稼働量（1ターンの最大工数）
  stamina: number;        // 現在の体力
  maxStamina: number;     // 最大体力
  skills: MemberSkills;
  specialSkill: SpecialSkill;
  // 状態
  isActive: boolean;      // プロジェクト参加中
  isBurnedOut: boolean;   // 燃え尽き症候群
  frozenUntilTurn?: number; // 一時凍結: このターン番号になったら自動復帰
  characterType: 'elite' | 'peaky' | 'risk' | 'gacha' | 'wildcard';
}

// ==========================================
// パートナー
// ==========================================
export type PartnerTier = 'veteran' | 'mid' | 'junior' | 'mystery';

export interface PartnerCard {
  id: string;
  name: string;
  tier: PartnerTier;
  workOutput: number;     // 工数出力
  autonomy: number;       // 自律度（低いと担当SEの稼働を消費）
  assignedSeId: string | null; // 担当SEのID
  proficiency: number;    // 習熟度（新人は育てると上昇）
}

// ==========================================
// タスク
// ==========================================
export interface Task {
  id: string;
  name: string;
  requiredWork: number;   // 必要工数
  completedWork: number;  // 完了工数
  requiredSkill: keyof MemberSkills; // 主要スキル
  assignedMemberIds: string[];
}

// ==========================================
// フェーズ
// ==========================================
export type PhaseType = 'requirements' | 'design' | 'development' | 'testing' | 'release';

export interface Phase {
  type: PhaseType;
  name: string;
  tasks: Task[];
  totalWork: number;
  completedWork: number;
  isCompleted: boolean;
  // スキルチェック（不足すると工数ペナルティ）
  skillChecks: Partial<Record<keyof MemberSkills, number>>;
}

// ==========================================
// イベント
// ==========================================
export type EventCategory = 'personnel' | 'technical' | 'customer' | 'internal' | 'partner' | 'positive';
export type EventSeverity = 1 | 2 | 3 | 4 | 5;

export interface EventEffect {
  type: 'add_work' | 'rollback_phase' | 'freeze_turns' | 'member_leave' | 'reduce_turns' | 'stamina_damage' | 'add_phase' | 'bonus';
  value: number;
  targetPhase?: PhaseType;
  description: string;
}

export interface EventCard {
  id: string;
  name: string;
  category: EventCategory;
  severity: EventSeverity;
  description: string;
  // 発生しやすいフェーズ
  likelyPhases: PhaseType[];
  // 未対処時の効果
  defaultEffect: EventEffect;
  // 対処条件
  counterCondition?: {
    skill: keyof MemberSkills;
    minValue: number;
    description: string;
  };
  // 対処時の効果（軽減版）
  counterEffect?: EventEffect;
}

// ==========================================
// プロジェクトタイプ
// ==========================================
export type ProjectType = 'app_development' | 'infra_release' | 'system_migration';

export interface ProjectConfig {
  type: ProjectType;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  totalTurns: number;
  budget: number;
  phases: Omit<Phase, 'completedWork' | 'isCompleted'>[];
  // このプロジェクトで必ず来る重大イベントID
  guaranteedEventIds: string[];
  description: string;
}

// ==========================================
// ゲーム状態
// ==========================================
export type GameScreen = 'home' | 'member_select' | 'project' | 'result' | 'collection';
export type TurnStep = 'event' | 'assign' | 'resolve';
export type GameOverReason = 'turns_exhausted' | 'no_members' | 'budget_exceeded' | 'security_failure';

export interface AssignmentMap {
  // memberId -> taskId
  memberToTask: Record<string, string | null>;
  // partnerId -> seId
  partnerToSe: Record<string, string | null>;
}

export interface TurnResult {
  workAdded: Record<string, number>; // taskId -> 追加工数
  staminaChanges: Record<string, number>; // memberId -> 体力変化
  phasesCompleted: PhaseType[];
  messages: string[];
}

export interface ProjectResult {
  projectType: ProjectType;
  turnsUsed: number;
  totalTurns: number;
  budgetUsed: number;
  budget: number;
  deadlineScore: 'S' | 'A' | 'B' | 'C' | 'D';
  costScore: 'S' | 'A' | 'B' | 'C' | 'D';
  qualityScore: 'S' | 'A' | 'B' | 'C' | 'D';
  overallScore: 'S' | 'A' | 'B' | 'C' | 'D';
  expGained: Record<string, number>; // memberId -> EXP
  unhandledEventCount: number;
  inefficientAssignmentCount: number; // 低スキルアサイン回数
}

export interface GameState {
  // 画面
  screen: GameScreen;

  // コレクション（全保有メンバー）
  collection: MemberCard[];

  // 現在のプロジェクト
  selectedProjectType: ProjectType | null;
  projectConfig: ProjectConfig | null;
  phases: Phase[];
  currentPhaseIndex: number;

  // チーム
  selectedMembers: MemberCard[];   // 編成したメンバー
  partners: PartnerCard[];          // プロジェクトで割り当てられたパートナー

  // ターン
  currentTurn: number;
  maxTurns: number;
  currentStep: TurnStep;

  // アサイン（このターンの配置）
  assignment: AssignmentMap;

  // イベント
  currentEvent: EventCard | null;
  eventHandled: boolean;
  unhandledEventCount: number;

  // まとめて進める
  bulkTurnsRemaining: number;

  // 低スキルアサイン累積カウント
  inefficientAssignmentCount: number;

  // ゲームオーバー
  isGameOver: boolean;
  gameOverReason: GameOverReason | null;

  // リザルト
  result: ProjectResult | null;

  // 全フェーズ完了後のナビゲーション待機フラグ（アニメーション完了後に result 画面へ遷移）
  pendingResultNav: boolean;
}
