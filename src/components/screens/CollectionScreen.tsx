import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { MemberCard, Role } from '../../types';

// ==========================================
// 定数
// ==========================================

const ROLE_LABELS: Record<Role, string> = {
  junior_se: '新人SE', se: 'SE', senior_se: 'シニアSE',
  pm: 'PM', playing_pm: 'プレイングPM', sales: '営業',
};

const ROLE_ICONS: Record<Role, string> = {
  junior_se: '💻', se: '💻', senior_se: '💻',
  pm: '👔', playing_pm: '👔', sales: '💼',
};

const CHAR_TYPE_LABELS: Record<MemberCard['characterType'], string> = {
  elite: '優等生', peaky: 'ピーキー', risk: 'リスク', gacha: 'ガチャ', wildcard: 'ワイルド',
};

const CHAR_TYPE_COLORS: Record<MemberCard['characterType'], string> = {
  elite: 'var(--green)', peaky: 'var(--blue-light)',
  risk: 'var(--highlight)', gacha: 'var(--yellow)', wildcard: '#b066ff',
};

const SKILL_LABELS: Record<string, string> = {
  appTech: 'アプリ技術', infraTech: 'インフラ技術', dbTech: 'DB技術',
  security: 'セキュリティ', communication: 'コミュ力', documentation: '資料力',
  presentation: 'プレゼン力', partnerMgmt: 'パートナー管理', responsibility: '責任感',
};

type SortKey = 'level' | 'cost' | 'name';

// ==========================================
// スキルバー
// ==========================================

const SkillBar = ({ label, value }: { label: string; value: number }) => (
  <div style={{ marginBottom: 4 }}>
    <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
      <span style={{ fontSize: 10, color: 'var(--gray)' }}>{label}</span>
      <span style={{
        fontSize: 10, fontWeight: 'bold',
        color: value >= 4 ? 'var(--green)' : value >= 2 ? 'var(--white)' : 'var(--gray-dark)',
      }}>
        {value}
      </span>
    </div>
    <div style={{
      height: 4, background: 'var(--accent)', borderRadius: 2, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${(value / 5) * 100}%`,
        background: value >= 4 ? 'var(--green)' : value >= 2 ? 'var(--blue-light)' : 'var(--gray-dark)',
        borderRadius: 2,
        transition: 'width 0.5s',
      }} />
    </div>
  </div>
);

// ==========================================
// メンバーカード詳細（展開時）
// ==========================================

const MemberDetailCard = ({ member }: { member: MemberCard }) => {
  const [expanded, setExpanded] = useState(false);
  const charColor = CHAR_TYPE_COLORS[member.characterType];

  return (
    <div
      className="card"
      style={{ marginBottom: 10, border: `1px solid ${charColor}44`, cursor: 'pointer' }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* ヘッダー行 */}
      <div className="flex items-center gap-12" style={{ marginBottom: expanded ? 12 : 0 }}>
        {/* アバター */}
        <div style={{
          width: 48, height: 48, flexShrink: 0,
          borderRadius: 12, background: `${charColor}22`,
          border: `2px solid ${charColor}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
        }}>
          {ROLE_ICONS[member.role]}
        </div>

        {/* 名前・役職 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-6" style={{ marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 'bold' }}>{member.name}</span>
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 4,
              background: `${charColor}22`, color: charColor,
            }}>
              {CHAR_TYPE_LABELS[member.characterType]}
            </span>
          </div>
          <div className="flex items-center gap-8">
            <span style={{ fontSize: 11, color: 'var(--gray)' }}>
              {ROLE_LABELS[member.role]}
            </span>
            <span style={{ fontSize: 11, color: 'var(--gray)' }}>
              年次{member.seniority}年
            </span>
          </div>
        </div>

        {/* レベル・コスト */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: 'var(--yellow)' }}>
            Lv{member.level}
          </div>
          <div style={{ fontSize: 11, color: member.cost === 0 ? 'var(--green)' : 'var(--gray)' }}>
            {member.cost === 0 ? '無料' : `${member.cost}pt`}
          </div>
        </div>

        <span style={{ fontSize: 14, color: 'var(--gray)', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* 展開時: 詳細 */}
      {expanded && (
        <>
          {/* ステータス行 */}
          <div className="flex gap-6" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            {[
              { label: '稼働', value: `${member.workCapacity}/T`, color: 'var(--blue-light)' },
              { label: '体力', value: `${member.stamina}/${member.maxStamina}`, color: 'var(--green)' },
              { label: 'EXP', value: member.exp, color: 'var(--yellow)' },
            ].map(item => (
              <div key={item.label} style={{
                flex: 1, minWidth: 60, textAlign: 'center',
                padding: '6px 4px', background: 'var(--accent)', borderRadius: 6,
              }}>
                <div style={{ fontSize: 9, color: 'var(--gray)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* スキル一覧 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 6, fontWeight: 'bold' }}>
              スキル
            </div>
            {Object.entries(member.skills).map(([key, val]) => (
              <SkillBar key={key} label={SKILL_LABELS[key] ?? key} value={val} />
            ))}
          </div>

          {/* 特殊スキル */}
          <div style={{
            background: `${charColor}11`,
            border: `1px solid ${charColor}44`,
            borderRadius: 8, padding: '8px 12px',
          }}>
            <div style={{ fontSize: 10, color: charColor, marginBottom: 4, fontWeight: 'bold', letterSpacing: 1 }}>
              ✦ 特殊スキル
            </div>
            <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 4 }}>
              {member.specialSkill.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.6 }}>
              {member.specialSkill.description}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ==========================================
// メインスクリーン
// ==========================================

export const CollectionScreen = () => {
  const { collection, goHome } = useGameStore();
  const [sortKey, setSortKey] = useState<SortKey>('level');
  const [filterRole, setFilterRole] = useState<'all' | 'pm' | 'se' | 'sales'>('all');

  const filtered = collection
    .filter(m => {
      if (filterRole === 'all') return true;
      if (filterRole === 'pm') return m.role === 'pm' || m.role === 'playing_pm';
      if (filterRole === 'se') return ['se', 'senior_se', 'junior_se'].includes(m.role);
      return m.role === 'sales';
    })
    .sort((a, b) => {
      if (sortKey === 'level') return b.level - a.level;
      if (sortKey === 'cost') return a.cost - b.cost;
      return a.name.localeCompare(b.name, 'ja');
    });

  return (
    <div className="app-container">
      <div className="screen-header">
        <button
          onClick={goHome}
          style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 20, padding: '0 8px 0 0' }}
        >
          ←
        </button>
        <h1 style={{ flex: 1 }}>メンバーコレクション</h1>
        <span style={{ fontSize: 13, color: 'var(--gray)' }}>{collection.length}人</span>
      </div>

      {/* フィルター & ソート */}
      <div style={{
        padding: '8px 12px', background: 'var(--bg-card)',
        borderBottom: '1px solid var(--accent)', flexShrink: 0,
      }}>
        {/* ロールフィルター */}
        <div className="flex gap-6" style={{ marginBottom: 8 }}>
          {(['all', 'pm', 'se', 'sales'] as const).map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11,
                background: filterRole === role ? 'var(--blue-light)' : 'var(--accent)',
                color: filterRole === role ? '#000' : 'var(--gray)',
                fontWeight: filterRole === role ? 'bold' : 'normal',
              }}
            >
              {{ all: '全員', pm: 'PM', se: 'SE', sales: '営業' }[role]}
            </button>
          ))}
        </div>
        {/* ソート */}
        <div className="flex items-center gap-8">
          <span style={{ fontSize: 10, color: 'var(--gray)' }}>並び替え:</span>
          {([['level', 'レベル'], ['cost', 'コスト'], ['name', '名前']] as [SortKey, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              style={{
                padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 10,
                background: sortKey === key ? 'var(--yellow)' : 'var(--accent)',
                color: sortKey === key ? '#000' : 'var(--gray)',
                fontWeight: sortKey === key ? 'bold' : 'normal',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* メンバー一覧 */}
      <div className="panel-scroll" style={{ flex: 1, minHeight: 0, padding: '12px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--gray)', padding: 40 }}>
            該当するメンバーがいません
          </div>
        ) : (
          filtered.map(member => (
            <MemberDetailCard key={member.id} member={member} />
          ))
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
};
