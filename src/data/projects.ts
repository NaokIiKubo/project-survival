import type { ProjectConfig } from '../types';

export const PROJECT_CONFIGS: ProjectConfig[] = [
  {
    type: 'app_development',
    name: 'アプリ開発',
    difficulty: 3,
    totalTurns: 16,
    budget: 100,
    description: 'Webアプリケーションの新規開発。要件定義からリリースまでを担う。',
    guaranteedEventIds: ['ev_client_rejection', 'ev_bug_before_release'],
    phases: [
      {
        type: 'requirements',
        name: '要件定義',
        totalWork: 25,
        skillChecks: { communication: 5, documentation: 3 },
        tasks: [
          { id: 'req_1', name: '要件ヒアリング', requiredWork: 12, completedWork: 0, requiredSkill: 'communication', assignedMemberIds: [] },
          { id: 'req_2', name: '要件定義書作成', requiredWork: 13, completedWork: 0, requiredSkill: 'documentation', assignedMemberIds: [] },
        ],
      },
      {
        type: 'design',
        name: '設計',
        totalWork: 30,
        skillChecks: { appTech: 5, documentation: 5 },
        tasks: [
          { id: 'des_1', name: '基本設計書', requiredWork: 15, completedWork: 0, requiredSkill: 'appTech', assignedMemberIds: [] },
          { id: 'des_2', name: '画面設計', requiredWork: 15, completedWork: 0, requiredSkill: 'documentation', assignedMemberIds: [] },
        ],
      },
      {
        type: 'development',
        name: '開発',
        totalWork: 70,
        skillChecks: { appTech: 3, partnerMgmt: 4 },
        tasks: [
          { id: 'dev_1', name: 'バックエンド実装', requiredWork: 35, completedWork: 0, requiredSkill: 'appTech', assignedMemberIds: [] },
          { id: 'dev_2', name: 'フロントエンド実装', requiredWork: 35, completedWork: 0, requiredSkill: 'appTech', assignedMemberIds: [] },
        ],
      },
      {
        type: 'testing',
        name: 'テスト',
        totalWork: 35,
        skillChecks: { appTech: 3, documentation: 4 },
        tasks: [
          { id: 'tst_1', name: '単体テスト', requiredWork: 20, completedWork: 0, requiredSkill: 'appTech', assignedMemberIds: [] },
          { id: 'tst_2', name: '結合テスト', requiredWork: 15, completedWork: 0, requiredSkill: 'documentation', assignedMemberIds: [] },
        ],
      },
      {
        type: 'release',
        name: 'リリース',
        totalWork: 15,
        skillChecks: { communication: 4, presentation: 3 },
        tasks: [
          { id: 'rel_1', name: '受け入れテスト対応', requiredWork: 8, completedWork: 0, requiredSkill: 'communication', assignedMemberIds: [] },
          { id: 'rel_2', name: 'リリース作業', requiredWork: 7, completedWork: 0, requiredSkill: 'presentation', assignedMemberIds: [] },
        ],
      },
    ],
  },
  {
    type: 'infra_release',
    name: 'インフラ公開',
    difficulty: 4,
    totalTurns: 20,
    budget: 120,
    description: 'サーバー・ネットワーク環境の構築と本番公開。セキュリティ対応が必須。',
    guaranteedEventIds: ['ev_security_incident', 'ev_infra_down'],
    phases: [
      {
        type: 'requirements',
        name: '要件定義',
        totalWork: 20,
        skillChecks: { communication: 3, infraTech: 3 },
        tasks: [
          { id: 'ireq_1', name: '構成要件整理', requiredWork: 10, completedWork: 0, requiredSkill: 'infraTech', assignedMemberIds: [] },
          { id: 'ireq_2', name: 'セキュリティ要件定義', requiredWork: 10, completedWork: 0, requiredSkill: 'security', assignedMemberIds: [] },
        ],
      },
      {
        type: 'design',
        name: 'インフラ設計',
        totalWork: 35,
        skillChecks: { infraTech: 6, security: 4 },
        tasks: [
          { id: 'ides_1', name: 'ネットワーク設計', requiredWork: 18, completedWork: 0, requiredSkill: 'infraTech', assignedMemberIds: [] },
          { id: 'ides_2', name: 'セキュリティ設計', requiredWork: 17, completedWork: 0, requiredSkill: 'security', assignedMemberIds: [] },
        ],
      },
      {
        type: 'development',
        name: '構築',
        totalWork: 60,
        skillChecks: { infraTech: 4, partnerMgmt: 3 },
        tasks: [
          { id: 'ibld_1', name: 'サーバー構築', requiredWork: 30, completedWork: 0, requiredSkill: 'infraTech', assignedMemberIds: [] },
          { id: 'ibld_2', name: 'ネットワーク設定', requiredWork: 30, completedWork: 0, requiredSkill: 'infraTech', assignedMemberIds: [] },
        ],
      },
      {
        type: 'testing',
        name: '検証',
        totalWork: 40,
        skillChecks: { infraTech: 5, security: 5 },
        tasks: [
          { id: 'itst_1', name: '負荷テスト', requiredWork: 20, completedWork: 0, requiredSkill: 'infraTech', assignedMemberIds: [] },
          { id: 'itst_2', name: 'セキュリティ検証', requiredWork: 20, completedWork: 0, requiredSkill: 'security', assignedMemberIds: [] },
        ],
      },
      {
        type: 'release',
        name: '公開・切替',
        totalWork: 20,
        skillChecks: { infraTech: 4, responsibility: 4 },
        tasks: [
          { id: 'irel_1', name: '本番切替', requiredWork: 12, completedWork: 0, requiredSkill: 'infraTech', assignedMemberIds: [] },
          { id: 'irel_2', name: '公開確認', requiredWork: 8, completedWork: 0, requiredSkill: 'responsibility', assignedMemberIds: [] },
        ],
      },
    ],
  },
  {
    type: 'system_migration',
    name: 'システム移行',
    difficulty: 5,
    totalTurns: 28,
    budget: 150,
    description: '既存システムの新環境への移行。アプリ・インフラ・DB全てのスキルが必要な最高難易度案件。',
    guaranteedEventIds: ['ev_data_loss', 'ev_partner_contract_end', 'ev_keyman_resign'],
    phases: [
      {
        type: 'requirements',
        name: '移行要件定義',
        totalWork: 30,
        skillChecks: { communication: 4, dbTech: 3 },
        tasks: [
          { id: 'mreq_1', name: '現行調査', requiredWork: 15, completedWork: 0, requiredSkill: 'dbTech', assignedMemberIds: [] },
          { id: 'mreq_2', name: '移行要件整理', requiredWork: 15, completedWork: 0, requiredSkill: 'communication', assignedMemberIds: [] },
        ],
      },
      {
        type: 'design',
        name: '移行設計',
        totalWork: 50,
        skillChecks: { appTech: 4, infraTech: 4, dbTech: 5 },
        tasks: [
          { id: 'mdes_1', name: 'AP移行設計', requiredWork: 17, completedWork: 0, requiredSkill: 'appTech', assignedMemberIds: [] },
          { id: 'mdes_2', name: 'インフラ移行設計', requiredWork: 16, completedWork: 0, requiredSkill: 'infraTech', assignedMemberIds: [] },
          { id: 'mdes_3', name: 'DB移行設計', requiredWork: 17, completedWork: 0, requiredSkill: 'dbTech', assignedMemberIds: [] },
        ],
      },
      {
        type: 'development',
        name: '移行ツール開発',
        totalWork: 90,
        skillChecks: { dbTech: 6, security: 3 },
        tasks: [
          { id: 'mdev_1', name: '移行スクリプト開発', requiredWork: 45, completedWork: 0, requiredSkill: 'dbTech', assignedMemberIds: [] },
          { id: 'mdev_2', name: 'データ検証ツール開発', requiredWork: 45, completedWork: 0, requiredSkill: 'appTech', assignedMemberIds: [] },
        ],
      },
      {
        type: 'testing',
        name: 'テスト・検証',
        totalWork: 55,
        skillChecks: { appTech: 4, infraTech: 4, dbTech: 4 },
        tasks: [
          { id: 'mtst_1', name: '移行リハーサル', requiredWork: 30, completedWork: 0, requiredSkill: 'dbTech', assignedMemberIds: [] },
          { id: 'mtst_2', name: 'データ整合性確認', requiredWork: 25, completedWork: 0, requiredSkill: 'appTech', assignedMemberIds: [] },
        ],
      },
      {
        type: 'release',
        name: '本番切替',
        totalWork: 25,
        skillChecks: { responsibility: 5, infraTech: 4 },
        tasks: [
          { id: 'mrel_1', name: '本番移行実行', requiredWork: 15, completedWork: 0, requiredSkill: 'responsibility', assignedMemberIds: [] },
          { id: 'mrel_2', name: '切替後確認', requiredWork: 10, completedWork: 0, requiredSkill: 'infraTech', assignedMemberIds: [] },
        ],
      },
    ],
  },
];