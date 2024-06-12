export interface Email {
    id: string;
    subject: string;
    bodyHTML: string;
    leadId: string;
    senderId: string;
    emailCampaignId: string;
    replyToEmail: string;
}
  
export interface CampaignOrg {
    id: string;
    name: string;
}
  

export const isEmail = (email: any): email is Email => {
  return (
    typeof email.id === 'string' &&
    typeof email.subject === 'string' &&
    typeof email.bodyHTML === 'string' &&
    typeof email.leadId === 'string' &&
    typeof email.senderId === 'string' &&
    typeof email.emailCampaignId === 'string' &&
    typeof email.replyToEmail === 'string'
  );
};

export const isCampaignOrg = (campaignOrg: any): campaignOrg is CampaignOrg => {
  return (
    typeof campaignOrg.id === 'string' &&
    typeof campaignOrg.name === 'string'
  );
};
