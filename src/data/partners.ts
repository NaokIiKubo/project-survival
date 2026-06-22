import type { PartnerCard, PartnerTier } from '../types';

const makePartner = (
  id: string, name: string, tier: PartnerTier,
  workOutput: number, autonomy: number,
): PartnerCard => ({
  id, name, tier, workOutput, autonomy,
  assignedSeId: null,
  proficiency: tier === 'junior' ? 0 : tier === 'mid' ? 3 : tier === 'veteran' ? 5 : 0,
});

export const PARTNER_POOL: PartnerCard[] = [
  makePartner('p_veteran_1', 'Aさん', 'veteran', 4, 4),
  makePartner('p_veteran_2', 'Bさん', 'veteran', 4, 5),
  makePartner('p_mid_1', 'Cさん', 'mid', 3, 3),
  makePartner('p_mid_2', 'Dさん', 'mid', 3, 3),
  makePartner('p_mid_3', 'Eさん', 'mid', 2, 2),
  makePartner('p_junior_1', 'Fさん', 'junior', 1, 0),
  makePartner('p_junior_2', 'Gさん', 'junior', 1, 0),
  makePartner('p_mystery_1', 'Hさん', 'mystery', 1, 1),
  makePartner('p_mystery_2', 'Iさん', 'mystery', 1, 1),
];

export const PARTNER_TIER_LABELS: Record<PartnerTier, string> = {
  veteran: 'ベテラン',
  mid: '中堅',
  junior: '新人',
  mystery: '謎',
};

export const PARTNER_TIER_COLORS: Record<PartnerTier, string> = {
  veteran: '#2ECC71',
  mid: '#5DADE8',
  junior: '#F5A623',
  mystery: '#AA44CC',
};

// プロジェクト開始時にランダムでパートナーを割り当てる
export const drawPartners = (count: number): PartnerCard[] => {
  const shuffled = [...PARTNER_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(p => ({
    ...p,
    assignedSeId: null,
    proficiency: p.tier === 'junior' ? 0 : p.tier === 'mid' ? 3 : p.tier === 'veteran' ? 5 : 0,
  }));
};
