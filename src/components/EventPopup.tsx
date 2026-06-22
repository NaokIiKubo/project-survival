import { useGameStore } from '../store/gameStore';
import type { EventCard, MemberCard, PartnerCard } from '../types';

const SEVERITY_COLORS: Record<number, string> = {
  1: 'var(--green)', 2: 'var(--blue-light)', 3: 'var(--yellow)',
  4: 'var(--highlight)', 5: '#FF0044',
};

const SEVERITY_LABELS: Record<number, string> = {
  1: '朗報', 2: '軽微', 3: '問題', 4: '重大', 5: '危機',
};

const CATEGORY_ICONS: Record<string, string> = {
  personnel: '👤', technical: '⚙️', customer: '🏢',
  internal: '🏛️', partner: '🤝', positive: '✨',
};

const ROLE_LABELS: Record<string, string> = {
  junior_se: '新人SE', se: 'SE', senior_se: 'シニアSE',
  pm: 'PM', playing_pm: 'プレイングPM', sales: '営業',
};

// ==========================================
// 対象の特定
// ==========================================

interface ResolvedTarget {
  member: MemberCard | null;       // 特定個人（キーマンなど）
  affectedPartners: PartnerCard[] | null; // パートナー全員
  isAllTeam: boolean;              // チーム全員
}

const resolveTarget = (
  event: EventCard,
  members: MemberCard[],
  partners: PartnerCard[],
): ResolvedTarget => {
  const active = members.filter(m => m.isActive && !m.isBurnedOut);

  switch (event.id) {
    case 'ev_keyman_resign':
    case 'ev_forced_transfer': {
      const keyMan = [...active].sort((a, b) => b.level - a.level)[0] ?? null;
      return { member: keyMan, affectedPartners: null, isAllTeam: false };
    }
    case 'ev_partner_contract_end':
      return { member: null, affectedPartners: partners, isAllTeam: false };
    case 'ev_team_sick':
      return { member: null, affectedPartners: null, isAllTeam: true };
    default:
      return { member: null, affectedPartners: null, isAllTeam: false };
  }
};

// 説明文にメンバー名を埋め込む
const personalizeText = (
  text: string,
  member: MemberCard | null,
  affectedPartners: PartnerCard[] | null,
): string => {
  let result = text;
  if (member) {
    result = result
      .replace(/最高レベルのメンバー/g, `${member.name}（Lv${member.level}）`)
      .replace(/最高Lvメンバー/g, `${member.name}（Lv${member.level}）`)
      .replace(/主力メンバー/g, `${member.name}`);
  }
  if (affectedPartners && affectedPartners.length > 0) {
    const names = affectedPartners.map(p => p.name).join('・');
    result = result.replace(/全パートナー/g, names);
  }
  return result;
};

// ==========================================
// コンポーネント
// ==========================================

interface EventPopupProps {
  event: EventCard;
}

export const EventPopup = ({ event }: EventPopupProps) => {
  const { handleEvent, selectedMembers, partners } = useGameStore();

  const isPositive = event.category === 'positive';
  const severityColor = SEVERITY_COLORS[event.severity];

  // 対象の特定
  const target = resolveTarget(event, selectedMembers, partners);
  const personalizedDesc = personalizeText(event.description, target.member, target.affectedPartners);

  // 対処可能スキルチェック
  let canCounter = false;
  if (event.counterCondition) {
    const { skill, minValue } = event.counterCondition;
    const totalSkill = selectedMembers
      .filter(m => m.isActive && !m.isBurnedOut)
      .reduce((sum, m) => sum + m.skills[skill], 0);
    canCounter = totalSkill >= minValue;
  }

  return (
    <div className="overlay">
      <div className="overlay-card" style={{ borderColor: severityColor }}>

        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-8">
            <span style={{ fontSize: 24 }}>{CATEGORY_ICONS[event.category] ?? '⚠️'}</span>
            <div>
              <div style={{ fontSize: 11, color: severityColor, fontWeight: 'bold', letterSpacing: 1 }}>
                {SEVERITY_LABELS[event.severity]} / Lv{event.severity}
              </div>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>{event.name}</div>
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: severityColor + '33', border: `1px solid ${severityColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 'bold', color: severityColor,
          }}>
            {event.severity}
          </div>
        </div>

        <div className="divider" />

        {/* イベント説明（メンバー名埋め込み済み） */}
        <div style={{
          background: 'var(--accent)', borderRadius: 8,
          padding: '10px', marginBottom: 10,
          fontSize: 13, lineHeight: 1.7, color: 'var(--gray)',
        }}>
          {personalizedDesc}
        </div>

        {/* 対象メンバー表示 */}
        {target.member && (
          <div style={{
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid var(--yellow)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 10,
          }}>
            <div style={{ fontSize: 10, color: 'var(--yellow)', marginBottom: 6, letterSpacing: 1 }}>
              ⚠ 対象メンバー
            </div>
            <div className="flex items-center gap-8">
              <span style={{ fontSize: 18 }}>
                {target.member.role.includes('pm') ? '👔' : target.member.role === 'sales' ? '💼' : '💻'}
              </span>
              <div>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>{target.member.name}</span>
                <span className="text-small text-gray" style={{ marginLeft: 6 }}>
                  {ROLE_LABELS[target.member.role]}
                </span>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div className="text-yellow text-bold" style={{ fontSize: 13 }}>Lv{target.member.level}</div>
                <div className="text-small text-gray">年次{target.member.seniority}</div>
              </div>
            </div>
          </div>
        )}

        {/* 対象パートナー表示 */}
        {target.affectedPartners && target.affectedPartners.length > 0 && (
          <div style={{
            background: 'rgba(245,166,35,0.1)',
            border: '1px solid var(--yellow)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 10,
          }}>
            <div style={{ fontSize: 10, color: 'var(--yellow)', marginBottom: 6, letterSpacing: 1 }}>
              ⚠ 対象パートナー（全員）
            </div>
            <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
              {target.affectedPartners.map(p => (
                <span key={p.id} style={{
                  fontSize: 12, background: 'var(--accent)',
                  padding: '3px 10px', borderRadius: 4,
                }}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* チーム全員 */}
        {target.isAllTeam && (
          <div style={{
            background: 'rgba(233,79,55,0.1)',
            border: '1px solid var(--highlight)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 10,
          }}>
            <div style={{ fontSize: 10, color: 'var(--highlight)', marginBottom: 4, letterSpacing: 1 }}>
              ⚠ 対象：チーム全員
            </div>
            <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
              {selectedMembers.filter(m => m.isActive).map(m => (
                <span key={m.id} style={{ fontSize: 12, background: 'var(--accent)', padding: '3px 10px', borderRadius: 4 }}>
                  {m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* アクション */}
        {isPositive ? (
          <>
            <div style={{
              background: 'rgba(46,204,113,0.1)', border: '1px solid var(--green)',
              borderRadius: 8, padding: '8px 10px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: 'var(--green)', marginBottom: 4 }}>効果</div>
              <div style={{ fontSize: 13 }}>{event.defaultEffect.description}</div>
            </div>
            <button className="btn btn-success btn-full" onClick={() => handleEvent(false)}>
              ✅ 了解！次のターンへ
            </button>
          </>
        ) : (
          <>
            <div style={{
              background: 'rgba(233,79,55,0.1)', border: '1px solid var(--highlight)',
              borderRadius: 8, padding: '8px 10px', marginBottom: 8,
            }}>
              <div style={{ fontSize: 11, color: 'var(--highlight)', marginBottom: 4 }}>受け入れた場合</div>
              <div style={{ fontSize: 13 }}>{event.defaultEffect.description}</div>
            </div>

            {event.counterCondition && event.counterEffect && (
              <div style={{
                background: canCounter ? 'rgba(46,204,113,0.1)' : 'rgba(80,80,100,0.3)',
                border: `1px solid ${canCounter ? 'var(--green)' : 'var(--gray-dark)'}`,
                borderRadius: 8, padding: '8px 10px', marginBottom: 12,
              }}>
                <div style={{
                  fontSize: 11, marginBottom: 4,
                  color: canCounter ? 'var(--green)' : 'var(--gray-dark)',
                }}>
                  {canCounter ? '✅ 対処可能' : '❌ スキル不足で対処不可'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 4 }}>
                  条件: {event.counterCondition.description}
                </div>
                <div style={{ fontSize: 13, color: canCounter ? 'var(--white)' : 'var(--gray-dark)' }}>
                  {event.counterEffect.description}
                </div>
              </div>
            )}

            <div className="flex gap-8">
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => handleEvent(false)}>
                受け入れる
              </button>
              {event.counterCondition && (
                <button
                  className={`btn ${canCounter ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, opacity: canCounter ? 1 : 0.5 }}
                  onClick={() => handleEvent(true)}
                  disabled={!canCounter}
                >
                  {canCounter ? '対処する' : '対処不可'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
