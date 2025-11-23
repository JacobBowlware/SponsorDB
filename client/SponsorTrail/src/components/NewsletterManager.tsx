import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faNewspaper,
    faPlus,
    faTimes,
    faEdit,
    faTrash,
    faEnvelope,
    faPaperPlane,
    faEye,
    faGripVertical,
    faSearch,
    faExternalLink,
    faUsers,
    faTag,
    faSpinner,
    faSave,
    faCalendarAlt,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import '../css/components/NewsletterManager.css';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink?: string;
    rootDomain: string;
    tags?: string[];
    sponsorEmail?: string;
    contactPersonName?: string;
    contactPersonTitle?: string;
    contactType?: 'named_person' | 'business_email' | 'generic_email' | 'not_found';
    newslettersSponsored?: Array<{
        newsletterName: string;
        estimatedAudience: number;
        contentTags: string[];
        dateSponsored: string | Date;
    }>;
    avgAudienceSize?: number;
    totalPlacements?: number;
}

interface Newsletter {
    _id: string;
    subject: string;
    customIntro?: string;
    sponsors: Sponsor[];
    status: 'draft' | 'scheduled' | 'sent';
    scheduledFor?: Date;
    createdAt: Date;
    sentAt?: Date;
    recipientCount?: number;
    ctaIndex?: number;
}

const NewsletterManager: React.FC = () => {
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [currentNewsletter, setCurrentNewsletter] = useState<Newsletter | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSendingTest, setIsSendingTest] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showSponsorSearch, setShowSponsorSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableSponsors, setAvailableSponsors] = useState<Sponsor[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchNewsletters();
        fetchSubscriberCount();
    }, []);

    const fetchNewsletters = async () => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Authentication required');
                return;
            }
            const response = await axios.get(`${config.backendUrl}admin/newsletter/list`, {
                headers: { 'x-auth-token': token }
            });
            if (response.data) {
                if (response.data.success === false) {
                    // Explicit failure from server
                    setError(response.data.error || 'Failed to load newsletters');
                } else {
                    // Success - set newsletters (empty array is fine)
                    setNewsletters(response.data.newsletters || []);
                    setError(null); // Clear any previous errors
                }
            } else {
                setError('Invalid response from server');
            }
        } catch (err: any) {
            console.error('Error fetching newsletters:', err);
            // Only set error if it's a real error (not a successful empty response)
            if (err.response && err.response.status >= 400) {
                const errorMessage = err.response?.data?.error || err.message || 'Failed to load newsletters';
                setError(errorMessage);
            } else if (!err.response) {
                // Network error or no response
                setError('Network error - please check your connection');
            }
            // If response exists and status is OK, don't set error (might be empty array)
        }
    };

    const fetchSubscriberCount = async () => {
        try {
            const token = localStorage.getItem('token');
            // We'll get this from the send endpoint or create a separate endpoint
            // For now, estimate or fetch from user count
            setSubscriberCount(null);
        } catch (err) {
            // Ignore
        }
    };

    const handleGenerateNewsletter = async () => {
        try {
            setIsGenerating(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.post(`${config.backendUrl}admin/newsletter/generate`, {}, {
                headers: { 'x-auth-token': token }
            });
            
            if (response.data.success) {
                setCurrentNewsletter(response.data.newsletter);
                await fetchNewsletters();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate newsletter');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!currentNewsletter) return;
        
        try {
            setIsSaving(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${config.backendUrl}admin/newsletter/update/${currentNewsletter._id}`,
                {
                    subject: currentNewsletter.subject,
                    customIntro: currentNewsletter.customIntro || '',
                    sponsors: currentNewsletter.sponsors.map(s => s._id)
                },
                { headers: { 'x-auth-token': token } }
            );
            
            if (response.data.success) {
                setCurrentNewsletter(response.data.newsletter);
                await fetchNewsletters();
                alert('Newsletter saved successfully!');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save newsletter');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendTestEmail = async () => {
        if (!currentNewsletter) return;
        
        try {
            setIsSendingTest(true);
            setError(null);
            const token = localStorage.getItem('token');

            const response = await axios.post(
                `${config.backendUrl}admin/newsletter/send-test/${currentNewsletter._id}`,
                {},
                { headers: { 'x-auth-token': token } }
            );
            
            if (response.data.success) {
                const emailSentTo = response.data.testEmail || 'your email';
                alert(`Test email sent to ${emailSentTo}!`);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send test email');
        } finally {
            setIsSendingTest(false);
        }
    };

    const handleSendToAll = async () => {
        if (!currentNewsletter) return;
        
        const confirmed = window.confirm(
            `Send this newsletter to all subscribers?\n\nSubject: ${currentNewsletter.subject}\n\nThis action cannot be undone.`
        );
        
        if (!confirmed) return;

        try {
            setIsSending(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            // Update newsletter first
            await axios.put(
                `${config.backendUrl}admin/newsletter/update/${currentNewsletter._id}`,
                {
                    subject: currentNewsletter.subject,
                    customIntro: currentNewsletter.customIntro || '',
                    sponsors: currentNewsletter.sponsors.map(s => s._id)
                },
                { headers: { 'x-auth-token': token } }
            );
            
            // Then send
            const response = await axios.post(
                `${config.backendUrl}admin/newsletter/send/${currentNewsletter._id}`,
                {},
                { headers: { 'x-auth-token': token } }
            );
            
            if (response.data.success) {
                alert(`Newsletter sent successfully!\n\nSent to: ${response.data.sentCount} subscribers\nFailed: ${response.data.failedCount}`);
                setCurrentNewsletter(null);
                await fetchNewsletters();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send newsletter');
        } finally {
            setIsSending(false);
        }
    };

    const handleLoadNewsletter = async (newsletter: Newsletter) => {
        try {
            setError(null);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${config.backendUrl}admin/newsletter/${newsletter._id}`, {
                headers: { 'x-auth-token': token }
            });
            if (response.data && response.data.success) {
                setCurrentNewsletter(response.data.newsletter);
            } else {
                // If newsletter already has sponsors populated, use it directly
                if (newsletter.sponsors && newsletter.sponsors.length > 0) {
                    setCurrentNewsletter(newsletter);
                } else {
                    setError(response.data?.error || 'Failed to load newsletter');
                }
            }
        } catch (err: any) {
            console.error('Error loading newsletter:', err);
            // If newsletter already has sponsors populated, use it directly
            if (newsletter.sponsors && newsletter.sponsors.length > 0) {
                setCurrentNewsletter(newsletter);
                setError(null);
            } else {
                setError(err.response?.data?.error || 'Failed to load newsletter');
            }
        }
    };

    const handleAddSponsor = async () => {
        setShowSponsorSearch(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${config.backendUrl}admin/sponsors/all?page=1&limit=200&status=approved`,
                { headers: { 'x-auth-token': token } }
            );
            setAvailableSponsors(response.data.sponsors || []);
        } catch (err) {
            setError('Failed to load sponsors');
        }
    };

    const handleSelectSponsor = (sponsor: Sponsor) => {
        if (!currentNewsletter) return;
        const currentSponsors = currentNewsletter.sponsors || [];
        if (!currentSponsors.find(s => s._id === sponsor._id)) {
            setCurrentNewsletter({
                ...currentNewsletter,
                sponsors: [...currentSponsors, sponsor]
            });
        }
        setShowSponsorSearch(false);
        setSearchQuery('');
    };

    const handleRemoveSponsor = (index: number) => {
        if (!currentNewsletter) return;
        const sponsors = [...currentNewsletter.sponsors];
        sponsors.splice(index, 1);
        setCurrentNewsletter({
            ...currentNewsletter,
            sponsors
        });
    };

    const handleReplaceSponsor = (index: number) => {
        handleAddSponsor();
        // Store index for replacement logic
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || !currentNewsletter) return;
        const sponsors = [...currentNewsletter.sponsors];
        const draggedSponsor = sponsors[draggedIndex];
        sponsors.splice(draggedIndex, 1);
        sponsors.splice(index, 0, draggedSponsor);
        setCurrentNewsletter({
            ...currentNewsletter,
            sponsors
        });
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const getSponsorPlacements = (sponsor: Sponsor) => {
        if (!sponsor.newslettersSponsored || sponsor.newslettersSponsored.length === 0) return null;
        return sponsor.newslettersSponsored.slice(0, 5).map(n => {
            if (!n || !n.newsletterName) return '';
            const audience = n.estimatedAudience || 0;
            const audienceStr = audience >= 1000000 
                ? `${(audience / 1000000).toFixed(1)}M`
                : audience >= 1000
                ? `${(audience / 1000).toFixed(0)}K`
                : audience > 0
                ? `${audience}`
                : '';
            const contentTags = n.contentTags && Array.isArray(n.contentTags) && n.contentTags.length > 0
                ? n.contentTags.slice(0, 3).join('/')
                : 'readers';
            const audiencePart = audienceStr ? `${audienceStr} ${contentTags}` : contentTags;
            return `${n.newsletterName} (${audiencePart})`;
        }).filter(p => p !== '').join(', ');
    };

    const getSponsorPlacementsList = (sponsor: Sponsor): Array<{ name: string; audience: string }> | null => {
        if (!sponsor.newslettersSponsored || sponsor.newslettersSponsored.length === 0) return null;
        return sponsor.newslettersSponsored.slice(0, 5)
            .map(n => {
                if (!n || !n.newsletterName) return null;
                const audience = n.estimatedAudience || 0;
                const audienceStr = audience >= 1000000 
                    ? `${(audience / 1000000).toFixed(1)}M`
                    : audience >= 1000
                    ? `${(audience / 1000).toFixed(0)}K`
                    : audience > 0
                    ? `${audience}`
                    : '';
                const contentTags = n.contentTags && Array.isArray(n.contentTags) && n.contentTags.length > 0
                    ? n.contentTags.slice(0, 3).join('/')
                    : 'readers';
                const audiencePart = audienceStr ? ` (${audienceStr} ${contentTags})` : ` (${contentTags})`;
                return { name: n.newsletterName, audience: audiencePart };
            })
            .filter((p): p is { name: string; audience: string } => p !== null);
    };

    const getBestForTags = (sponsor: Sponsor) => {
        if (!sponsor.newslettersSponsored || sponsor.newslettersSponsored.length === 0) return null;
        const allContentTags = new Set<string>();
        sponsor.newslettersSponsored.forEach(n => {
            if (n.contentTags && Array.isArray(n.contentTags) && n.contentTags.length > 0) {
                n.contentTags.forEach(tag => {
                    // Normalize tag: trim whitespace and convert to lowercase for deduplication
                    const normalizedTag = tag.trim().toLowerCase();
                    if (normalizedTag) {
                        allContentTags.add(normalizedTag);
                    }
                });
            }
        });
        // Convert back to array, capitalize first letter of each tag, and limit to 5
        const uniqueTags = Array.from(allContentTags)
            .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1))
            .slice(0, 5);
        return uniqueTags.length > 0 ? uniqueTags.join(', ') : null;
    };

    const getAvgAudience = (sponsor: Sponsor) => {
        if (!sponsor.avgAudienceSize) return null;
        const avg = sponsor.avgAudienceSize;
        return avg >= 1000000 
            ? `${(avg / 1000000).toFixed(1)}M`
            : avg >= 1000
            ? `${(avg / 1000).toFixed(0)}K`
            : avg.toString();
    };

    const filteredSponsors = availableSponsors.filter(sponsor => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            sponsor.sponsorName?.toLowerCase().includes(query) ||
            sponsor.rootDomain?.toLowerCase().includes(query) ||
            sponsor.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    });

    return (
        <div className="newsletter-manager">
            <div className="newsletter-manager-header">
                <h2>
                    <FontAwesomeIcon icon={faNewspaper} />
                    Newsletter Management
                </h2>
            </div>

            {error && (
                <div className="error-message">{error}</div>
            )}

            {!currentNewsletter ? (
                <div className="newsletter-manager-empty">
                    <div className="empty-content">
                        <FontAwesomeIcon icon={faNewspaper} className="empty-icon" />
                        <h3>No Newsletter Selected</h3>
                        <p>Generate a new newsletter or select an existing one from the list below.</p>
                        <button 
                            className="btn-generate"
                            onClick={handleGenerateNewsletter}
                            disabled={isGenerating}
                        >
                            <FontAwesomeIcon icon={isGenerating ? faSpinner : faNewspaper} spin={isGenerating} />
                            {isGenerating ? 'Generating...' : 'Generate New Newsletter'}
                        </button>
                    </div>

                    {newsletters.length > 0 && (
                        <div className="newsletters-list">
                            <h3>Recent Newsletters</h3>
                            <div className="newsletters-grid">
                                {newsletters.map(newsletter => (
                                    <div 
                                        key={newsletter._id} 
                                        className="newsletter-card"
                                        onClick={() => handleLoadNewsletter(newsletter)}
                                    >
                                        <div className="newsletter-card-header">
                                            <span className={`status-badge status-${newsletter.status}`}>
                                                {newsletter.status}
                                            </span>
                                            {newsletter.sentAt && (
                                                <span className="sent-date">
                                                    {new Date(newsletter.sentAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <h4 className="newsletter-card-subject">{newsletter.subject}</h4>
                                        
                                        {/* Custom Intro / Body */}
                                        <div className="newsletter-card-body">
                                            <p className="newsletter-intro">
                                                {newsletter.customIntro || 'Here are 3 verified sponsors added to SponsorDB this week, with their previous placements and contact info.'}
                                            </p>
                                        </div>

                                        {/* Sponsors Preview - Show All */}
                                        <div className="newsletter-card-sponsors">
                                            {(newsletter.sponsors || []).map((sponsor, index) => (
                                                <div key={sponsor._id || index} className="newsletter-sponsor-preview">
                                                    <h5>{sponsor.sponsorName}</h5>
                                                    {sponsor.rootDomain && (
                                                        <p className="sponsor-domain-preview">{sponsor.rootDomain}</p>
                                                    )}
                                                    
                                                    {sponsor.tags && sponsor.tags.length > 0 && (
                                                        <p><strong>Markets:</strong> {sponsor.tags.join(', ')}</p>
                                                    )}
                                                    
                                                    {sponsor.sponsorEmail && (
                                                        <p><strong>Contact:</strong> {sponsor.sponsorEmail}{sponsor.contactPersonTitle ? ` (${sponsor.contactPersonTitle})` : ''}</p>
                                                    )}
                                                    
                                                    {(() => {
                                                        const placements = getSponsorPlacementsList(sponsor);
                                                        return placements && placements.length > 0 && (
                                                            <div>
                                                                <p><strong>Previously sponsored:</strong></p>
                                                                <ul className="sponsor-placements-list">
                                                                    {placements.map((placement, idx) => (
                                                                        <li key={idx}>
                                                                            <strong>{placement.name}</strong>{placement.audience}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    {index < (newsletter.sponsors?.length || 0) - 1 && (
                                                        <hr className="sponsor-divider" />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Meta Info */}
                                        <div className="newsletter-card-footer">
                                            <span className="newsletter-meta">
                                                {newsletter.sponsors?.length || 0} sponsor{(newsletter.sponsors?.length || 0) !== 1 ? 's' : ''}
                                                {newsletter.recipientCount && ` • ${newsletter.recipientCount} sent`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="newsletter-editor-container">
                    <div className="editor-header">
                        <h3>Edit Newsletter</h3>
                        <button 
                            className="btn-close"
                            onClick={() => setCurrentNewsletter(null)}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                            Close
                        </button>
                    </div>

                    <div className="editor-content">
                        {/* Subject Line */}
                        <div className="editor-field">
                            <label>Subject Line</label>
                            <input
                                type="text"
                                value={currentNewsletter.subject}
                                onChange={(e) => setCurrentNewsletter({
                                    ...currentNewsletter,
                                    subject: e.target.value
                                })}
                                placeholder="Enter newsletter subject"
                                className="subject-input"
                            />
                        </div>

                        {/* Custom Intro */}
                        <div className="editor-field">
                            <label>Custom Introduction (Optional)</label>
                            <textarea
                                value={currentNewsletter.customIntro || ''}
                                onChange={(e) => setCurrentNewsletter({
                                    ...currentNewsletter,
                                    customIntro: e.target.value
                                })}
                                placeholder="Add a custom intro message (supports markdown)"
                                className="intro-textarea"
                                rows={4}
                            />
                            <small>Leave empty to use default intro</small>
                        </div>

                        {/* Sponsors */}
                        <div className="editor-field">
                            <div className="field-header">
                                <label>Selected Sponsors ({currentNewsletter.sponsors?.length || 0})</label>
                                <button 
                                    className="btn-add-sponsor"
                                    onClick={handleAddSponsor}
                                >
                                    <FontAwesomeIcon icon={faPlus} />
                                    Add Sponsor
                                </button>
                            </div>

                            <div className="sponsors-grid-editor">
                                {(currentNewsletter.sponsors || []).map((sponsor, index) => (
                                    <div
                                        key={sponsor._id || index}
                                        className="sponsor-card-editor"
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className="sponsor-card-header">
                                            <FontAwesomeIcon icon={faGripVertical} className="drag-handle" />
                                            <div className="sponsor-actions">
                                                <button
                                                    className="btn-replace"
                                                    onClick={() => handleReplaceSponsor(index)}
                                                    title="Replace"
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button
                                                    className="btn-remove"
                                                    onClick={() => handleRemoveSponsor(index)}
                                                    title="Remove"
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="sponsor-card-body">
                                            <h4>{sponsor.sponsorName}</h4>
                                            <div className="sponsor-domain">
                                                <FontAwesomeIcon icon={faExternalLink} />
                                                {sponsor.rootDomain}
                                            </div>

                                            {/* Contact Info */}
                                            {sponsor.contactPersonName && sponsor.contactPersonTitle && sponsor.sponsorEmail ? (
                                                <div className="contact-info">
                                                    <div className="contact-person">
                                                        <strong>{sponsor.contactPersonName}</strong>
                                                        <span>{sponsor.contactPersonTitle}</span>
                                                    </div>
                                                    <div className="contact-email">
                                                        <FontAwesomeIcon icon={faEnvelope} />
                                                        <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}</a>
                                                    </div>
                                                    {sponsor.contactType === 'named_person' && (
                                                        <span className="badge-high">High Value Contact</span>
                                                    )}
                                                </div>
                                            ) : sponsor.sponsorEmail ? (
                                                <div className="contact-info">
                                                    <div className="contact-email">
                                                        <FontAwesomeIcon icon={faEnvelope} />
                                                        <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}</a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="contact-info">
                                                    <span className="no-contact">No contact info</span>
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {sponsor.tags && sponsor.tags.length > 0 && (
                                                <div className="sponsor-tags">
                                                    <FontAwesomeIcon icon={faTag} />
                                                    {sponsor.tags.slice(0, 3).join(', ')}
                                                </div>
                                            )}

                                            {/* Previously Sponsored */}
                                            {(() => {
                                                const placements = getSponsorPlacementsList(sponsor);
                                                return placements && placements.length > 0 && (
                                                    <div className="sponsor-placements">
                                                        <div className="placements-header">
                                                            <FontAwesomeIcon icon={faNewspaper} />
                                                            <strong>Previously sponsored:</strong>
                                                        </div>
                                                        <ul className="placements-list">
                                                            {placements.map((placement, idx) => (
                                                                <li key={idx}>
                                                                    <strong>{placement.name}</strong>{placement.audience}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })()}

                                            {/* Avg Audience */}
                                            {getAvgAudience(sponsor) && (
                                                <div className="sponsor-audience">
                                                    <FontAwesomeIcon icon={faUsers} />
                                                    <span>Avg audience: {getAvgAudience(sponsor)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="editor-actions">
                            <button
                                className="btn-action btn-save"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                            >
                                <FontAwesomeIcon icon={isSaving ? faSpinner : faSave} spin={isSaving} />
                                {isSaving ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button
                                className="btn-action btn-preview"
                                onClick={() => setShowPreview(!showPreview)}
                            >
                                <FontAwesomeIcon icon={faEye} />
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </button>
                            <button
                                className="btn-action btn-test"
                                onClick={handleSendTestEmail}
                                disabled={isSendingTest}
                            >
                                <FontAwesomeIcon icon={isSendingTest ? faSpinner : faEnvelope} spin={isSendingTest} />
                                {isSendingTest ? 'Sending...' : 'Send Test Email'}
                            </button>
                            <button
                                className="btn-action btn-send"
                                onClick={handleSendToAll}
                                disabled={isSending || currentNewsletter.status === 'sent'}
                            >
                                <FontAwesomeIcon icon={isSending ? faSpinner : faPaperPlane} spin={isSending} />
                                {isSending ? 'Sending...' : 'Send to All Subscribers'}
                            </button>
                        </div>

                        {/* Preview */}
                        {showPreview && (
                            <div className="email-preview">
                                <h4>Email Preview</h4>
                                <div className="preview-content">
                                    <div className="preview-subject">
                                        <strong>Subject:</strong> {currentNewsletter.subject}
                                    </div>
                                    <div className="preview-body">
                                        <p><strong>Hi [Name],</strong></p>
                                        <p>{currentNewsletter.customIntro || 'Here are 3 verified sponsors added to SponsorDB this week, with their previous placements and contact info.'}</p>
                                        {(currentNewsletter.sponsors || []).map((sponsor, index) => (
                                            <div key={sponsor._id || index} className="preview-sponsor">
                                                <h5>{sponsor.sponsorName}</h5>
                                                <p>{sponsor.rootDomain}</p>
                                                {sponsor.tags && sponsor.tags.length > 0 && (
                                                    <p><strong>Markets:</strong> {sponsor.tags.join(', ')}</p>
                                                )}
                                                {sponsor.sponsorEmail && (
                                                    <p><strong>Contact:</strong> {sponsor.sponsorEmail}</p>
                                                )}
                                                {(() => {
                                                    const placements = getSponsorPlacementsList(sponsor);
                                                    return placements && placements.length > 0 && (
                                                        <div>
                                                            <p><strong>Previously sponsored:</strong></p>
                                                            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
                                                                {placements.map((placement, idx) => (
                                                                    <li key={idx}>
                                                                        <strong>{placement.name}</strong>{placement.audience}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    );
                                                })()}
                                                {index < (currentNewsletter.sponsors?.length || 0) - 1 && <hr style={{ margin: '20px 0' }} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sponsor Search Modal */}
            {showSponsorSearch && (
                <div className="modal-overlay" onClick={() => setShowSponsorSearch(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add Sponsor</h3>
                            <button className="btn-close" onClick={() => setShowSponsorSearch(false)}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="modal-search">
                            <FontAwesomeIcon icon={faSearch} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, domain, or tags..."
                                className="search-input"
                            />
                        </div>
                        <div className="modal-sponsors">
                            {filteredSponsors.map(sponsor => (
                                <div
                                    key={sponsor._id}
                                    className="sponsor-search-item"
                                    onClick={() => handleSelectSponsor(sponsor)}
                                >
                                    <div className="search-item-header">
                                        <strong>{sponsor.sponsorName}</strong>
                                        <span>{sponsor.rootDomain}</span>
                                    </div>
                                    {sponsor.sponsorEmail && (
                                        <div className="search-item-contact">
                                            <FontAwesomeIcon icon={faEnvelope} />
                                            {sponsor.sponsorEmail}
                                        </div>
                                    )}
                                    {sponsor.tags && sponsor.tags.length > 0 && (
                                        <div className="search-item-tags">
                                            {sponsor.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsletterManager;

