const fs = require('fs');
const path = require('path');

/**
 * Render the weekly sponsors email template
 * @param {Object} params - Template parameters
 * @param {string} params.firstName - User's first name
 * @param {string} params.subject - Email subject
 * @param {Array} params.sponsors - Array of sponsor objects
 * @param {string} params.dashboardLink - Link to dashboard
 * @param {string} params.unsubscribeLink - Unsubscribe link
 * @returns {string} - Rendered HTML email
 */
const renderWeeklySponsorsTemplate = ({ firstName, subject, sponsors, dashboardLink, unsubscribeLink, customIntro, ctaText, ctaLink }) => {
    try {
        // Read the HTML template
        const templatePath = path.join(__dirname, '../templates/weekly-sponsors.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        // Replace top-level placeholders
        html = html.replace(/{subject}/g, subject || 'Weekly Sponsors from SponsorDB');
        html = html.replace(/{firstName}/g, firstName || 'there');
        html = html.replace(/{dashboardLink}/g, dashboardLink || '#');
        html = html.replace(/{unsubscribeLink}/g, unsubscribeLink || '#');
        
        // Replace custom intro if provided
        const introText = customIntro || 'Here are 3 verified sponsors added to SponsorDB this week, with their previous placements and contact info.';
        // Convert newlines to <br> tags for HTML email
        const introHtml = introText.replace(/\n/g, '<br>');
        html = html.replace(/{customIntro}/g, introHtml);
        
        // Replace CTA if provided
        const ctaHtml = ctaText && ctaLink 
            ? `<div class="cta-section">
                <a href="${ctaLink}" class="cta-link">${ctaText}</a>
            </div>`
            : '';
        html = html.replace(/{cta}/g, ctaHtml);

        // Build sponsor sections with enhanced data
        const sponsorSections = sponsors.map((sponsor, index) => {
            // Root domain
            const rootDomain = sponsor.rootDomain || '';
            
            // Tags/Market categories
            const tags = sponsor.tags && sponsor.tags.length > 0 
                ? sponsor.tags.join(', ') 
                : 'General';
            
            // Contact info
            let contactInfo = '';
            if (sponsor.sponsorEmail) {
                // Add title in parenthesis if available
                const emailDisplay = sponsor.contactPersonTitle 
                    ? `${sponsor.sponsorEmail} (${sponsor.contactPersonTitle})`
                    : sponsor.sponsorEmail;
                contactInfo = `<div class="sponsor-contact"><strong>Contact:</strong> <a href="mailto:${sponsor.sponsorEmail}">${emailDisplay}</a></div>`;
            } else if (sponsor.sponsorApplication) {
                contactInfo = `<div class="sponsor-contact"><strong>Contact:</strong> <a href="${sponsor.sponsorApplication}" target="_blank">Apply via website</a></div>`;
            }

            // Previously sponsored - bullet list format
            let previouslySponsoredHtml = '';
            // Debug: Log sponsor data to check newslettersSponsored
            if (sponsor.newslettersSponsored && Array.isArray(sponsor.newslettersSponsored) && sponsor.newslettersSponsored.length > 0) {
                const placements = sponsor.newslettersSponsored.slice(0, 5).map(n => {
                    if (!n || !n.newsletterName) return ''; // Skip invalid entries
                    
                    const audience = n.estimatedAudience || 0;
                    const audienceStr = audience >= 1000000 
                        ? `${(audience / 1000000).toFixed(1)}M`
                        : audience >= 1000
                        ? `${(audience / 1000).toFixed(0)}K`
                        : audience > 0
                        ? `${audience}`
                        : '';
                    
                    // Get content tags for this placement
                    const contentTags = n.contentTags && Array.isArray(n.contentTags) && n.contentTags.length > 0 
                        ? n.contentTags.slice(0, 3).join('/')
                        : 'readers';
                    
                    const audiencePart = audienceStr ? ` (${audienceStr} ${contentTags})` : ` (${contentTags})`;
                    return `<li><strong>${n.newsletterName}</strong>${audiencePart}</li>`;
                }).filter(p => p !== '').join(''); // Filter out empty strings
                
                if (placements) {
                    previouslySponsoredHtml = `
                        <div class="sponsor-previously-sponsored">
                            <strong>Previously sponsored:</strong>
                            <ul style="margin: 8px 0; padding-left: 20px; color: #475569;">
                                ${placements}
                            </ul>
                        </div>
                    `;
                }
            }

            const divider = index > 0 
                ? '<div class="divider-text">━━━━━━━━━━━━━━━━</div>'
                : '';
            
            return `
                ${divider}
                <div class="sponsor-section">
                    <div class="sponsor-name">${sponsor.sponsorName || 'Unknown Sponsor'}</div>
                    ${rootDomain ? `<div class="sponsor-domain">${rootDomain}</div>` : ''}
                    <div class="sponsor-tags"><strong>Markets:</strong> ${tags}</div>
                    ${contactInfo}
                    ${previouslySponsoredHtml}
                </div>
            `;
        }).join('');

        // Replace sponsors placeholder
        html = html.replace(/{sponsors}/g, sponsorSections);

        return html;
    } catch (error) {
        console.error('Error rendering email template:', error);
        // Fallback to plain text if template fails
        return generatePlainTextFallback({ firstName, subject, sponsors, dashboardLink, unsubscribeLink, customIntro: introText });
    }
};

/**
 * Generate plain text fallback if template fails
 */
const generatePlainTextFallback = ({ firstName, subject, sponsors, dashboardLink, unsubscribeLink, customIntro }) => {
    const firstNameText = firstName || 'there';
    const introText = customIntro || 'Here are 3 verified sponsors added to SponsorDB this week, with their previous placements and contact info.';
    // Preserve newlines in plain text (they'll display correctly in email clients)
    
    const sponsorsList = sponsors.map((sponsor, index) => {
        const rootDomain = sponsor.rootDomain ? `\n${sponsor.rootDomain}` : '';
        const tags = sponsor.tags && sponsor.tags.length > 0 ? sponsor.tags.join(', ') : 'General';
        
        let contact = '';
        if (sponsor.sponsorEmail) {
            // Add title in parenthesis if available
            const emailDisplay = sponsor.contactPersonTitle 
                ? `${sponsor.sponsorEmail} (${sponsor.contactPersonTitle})`
                : sponsor.sponsorEmail;
            contact = `Contact: ${emailDisplay}`;
        } else if (sponsor.sponsorApplication) {
            contact = `Contact: Apply via website - ${sponsor.sponsorApplication}`;
        }

        // Previously sponsored - bullet format
        let previouslySponsored = '';
        if (sponsor.newslettersSponsored && sponsor.newslettersSponsored.length > 0) {
            const placements = sponsor.newslettersSponsored.slice(0, 5).map(n => {
                const audience = n.estimatedAudience || 0;
                const audienceStr = audience >= 1000000 
                    ? `${(audience / 1000000).toFixed(1)}M`
                    : audience >= 1000
                    ? `${(audience / 1000).toFixed(0)}K`
                    : audience.toString();
                
                const contentTags = n.contentTags && n.contentTags.length > 0 
                    ? n.contentTags.slice(0, 3).join('/')
                    : 'readers';
                
                return `- ${n.newsletterName} (${audienceStr} ${contentTags})`;
            }).join('\n');
            
            if (placements) {
                previouslySponsored = `\n\nPreviously sponsored:\n${placements}`;
            }
        }

        return `
━━━━━━━━━━━━━━━━
${sponsor.sponsorName || 'Unknown Sponsor'}${rootDomain}
Markets: ${tags}
${contact}${previouslySponsored}`;
    }).join('\n');

    return `Hi ${firstNameText},

${introText}

${sponsorsList}

Unsubscribe: ${unsubscribeLink || '#'}`;
};

module.exports = {
    renderWeeklySponsorsTemplate,
    generatePlainTextFallback
};

