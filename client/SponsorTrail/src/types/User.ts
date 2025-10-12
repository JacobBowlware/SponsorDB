// User types based on backend schema
export interface BillingInfo {
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing';
  monthlyCharge: number;
  currency: string;
  nextBillingDate?: Date;
  trialEnd?: Date;
}

export interface AudienceDemographics {
  age_range?: '18-25' | '26-35' | '36-45' | '45+';
  income_range?: '<50K' | '50-100K' | '100K+';
  location?: 'US' | 'Europe' | 'Global';
  interests?: string[];
  job_titles?: string[];
}

export interface SponsorshipHistory {
  previous_sponsors?: string[];
  typical_rates?: {
    newsletter_mention?: number;
    dedicated_email?: number;
    banner_ad?: number;
  };
}

export interface OutreachPreferences {
  style?: 'professional' | 'casual' | 'personal';
  follow_up_frequency?: 'once' | 'twice' | 'three_times';
  minimum_deal_size?: number;
}

export interface SponsorMatchProfile {
  ideal_sponsor_categories?: string[];
  predicted_response_rate?: number;
  recommended_outreach_times?: string[];
  personalization_data_points?: string[];
}

export interface OutreachStats {
  emails_sent?: number;
  responses_received?: number;
  deals_closed?: number;
  total_revenue?: number;
  average_response_rate?: number;
}

export interface NewsletterInfo {
  // Basic Info
  name?: string;
  topic?: string;
  audience_size?: number;
  engagement_rate?: number;
  publishing_frequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  
  // Demographics
  audience_demographics?: AudienceDemographics;
  
  // Experience & Preferences
  sponsorship_history?: SponsorshipHistory;
  outreach_preferences?: OutreachPreferences;
  
  // Generated insights
  sponsor_match_profile?: SponsorMatchProfile;
  
  // Analytics
  outreach_stats?: OutreachStats;
}

export interface SponsorInteraction {
  sponsor_id: string;
  interaction_type: 'viewed' | 'contacted' | 'responded' | 'deal_closed';
  date: Date;
  notes?: string;
  outcome?: string;
}

export interface User {
  email: string;
  isAdmin: boolean;
  subscription: 'premium' | 'none' | null;
  stripeCustomerId: string;
  billing: BillingInfo | null;
  newsletterInfo: NewsletterInfo | null;
  sponsor_interactions?: SponsorInteraction[];
  // Additional fields that might be present
  name?: string;
  picture?: string;
  googleId?: string;
}
