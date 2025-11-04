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
const renderWeeklySponsorsTemplate = ({ firstName, subject, sponsors, dashboardLink, unsubscribeLink }) => {
    try {
        // Read the HTML template
        const templatePath = path.join(__dirname, '../templates/weekly-sponsors.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        // Replace top-level placeholders
        html = html.replace(/{subject}/g, subject || 'Weekly Sponsors from SponsorDB');
        html = html.replace(/{firstName}/g, firstName || 'there');
        html = html.replace(/{dashboardLink}/g, dashboardLink || '#');
        html = html.replace(/{unsubscribeLink}/g, unsubscribeLink || '#');

        // Build sponsor sections
        const sponsorSections = sponsors.map((sponsor, index) => {
            const tags = sponsor.tags && sponsor.tags.length > 0 
                ? sponsor.tags.join(', ') 
                : 'General';
            
            const contactInfo = sponsor.sponsorEmail 
                ? `<div class="sponsor-contact">Email: <a href="mailto:${sponsor.sponsorEmail}">${sponsor.sponsorEmail}</a></div>`
                : sponsor.sponsorApplication 
                    ? `<div class="sponsor-contact">Apply: <a href="${sponsor.sponsorApplication}" target="_blank">${sponsor.sponsorApplication}</a></div>`
                    : '';

            const viewLink = dashboardLink || '#';
            
            const divider = index > 0 
                ? '<div class="divider-text">━━━━━━━━━━━━━━━━</div>'
                : '';
            
            return `
                ${divider}
                <div class="sponsor-section">
                    <div class="sponsor-name">${sponsor.sponsorName || 'Unknown Sponsor'}</div>
                    <div class="sponsor-tags">${tags}</div>
                    ${contactInfo}
                    <a href="${viewLink}" class="dashboard-link">View in dashboard</a>
                </div>
            `;
        }).join('');

        // Replace sponsors placeholder
        html = html.replace(/{sponsors}/g, sponsorSections);

        return html;
    } catch (error) {
        console.error('Error rendering email template:', error);
        // Fallback to plain text if template fails
        return generatePlainTextFallback({ firstName, subject, sponsors, dashboardLink, unsubscribeLink });
    }
};

/**
 * Generate plain text fallback if template fails
 */
const generatePlainTextFallback = ({ firstName, subject, sponsors, dashboardLink, unsubscribeLink }) => {
    const firstNameText = firstName || 'there';
    const sponsorsList = sponsors.map((sponsor, index) => {
        const tags = sponsor.tags && sponsor.tags.length > 0 ? sponsor.tags.join(', ') : 'General';
        const contact = sponsor.sponsorEmail 
            ? `Email: ${sponsor.sponsorEmail}` 
            : sponsor.sponsorApplication 
                ? `Apply: ${sponsor.sponsorApplication}`
                : '';
        
        return `
━━━━━━━━━━━━━━━━
${sponsor.sponsorName || 'Unknown Sponsor'}
${tags}
${contact}
View in dashboard: ${dashboardLink || '#'}`;
    }).join('\n');

    return `Hi ${firstNameText},

Here are some verified sponsors from SponsorDB this week:

${sponsorsList}

Browse all 100+ sponsors: ${dashboardLink || '#'}

Unsubscribe: ${unsubscribeLink || '#'}`;
};

module.exports = {
    renderWeeklySponsorsTemplate,
    generatePlainTextFallback
};

