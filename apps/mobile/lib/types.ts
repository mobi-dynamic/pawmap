export type DogPolicyStatus = 'allowed' | 'restricted' | 'not_allowed' | 'unknown';

export type PlaceSummary = {
  id: string;
  name: string;
  formattedAddress: string;
  category: string;
  dogPolicyStatus: DogPolicyStatus;
  summary: string;
};
