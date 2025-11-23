import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSave,
    faPaperPlane,
    faCalendarAlt,
    faClock,
    faEye,
    faEyeSlash,
    faTimes,
    faSearch,
    faGripVertical,
    faEnvelope,
    faExternalLink,
    faUsers,
    faTag,
    faNewspaper,
    faEdit,
    faTrash,
    faPlus,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import config from '../config';
import '../css/components/NewsletterEditor.css';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
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

interface NewsletterEditorProps {
    newsletter: any;
    onSave: (newsletter: any) => void;
    onSend: (newsletter: any) => void;
    onSchedule: (newsletter: any, scheduledFor: Date) => void;
    onSendTest: (newsletter: any) => void;
    onClose: () => void;
    subscriberCount?: number;
}

const NewsletterEditor: React.FC<NewsletterEditorProps> = ({
    newsletter,
    onSave,
    onSend,
    onSchedule,
    onSendTest,
    onClose,
    subscriberCount
}) => {
    const [editedNewsletter, setEditedNewsletter] = useState<any>(newsletter);
    const [customIntro, setCustomIntro] = useState(newsletter?.customIntro || '');
    const [subject, setSubject] = useState(newsletter?.subject || '');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('09:00');
    const [showPreview, setShowPreview] = useState(false);
    const [showSponsorSearch, setShowSponsorSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableSponsors, setAvailableSponsors] = useState<Sponsor[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isLoadingSponsors, setIsLoadingSponsors] = useState(false);

    // Calculate default scheduled date (next Sunday 9am)
    useEffect(() => {
        if (!scheduledDate && !newsletter?.scheduledFor) {
            const nextSunday = getNextSunday();
            setScheduledDate(nextSunday.toISOString().split('T')[0]);
        } else if (newsletter?.scheduledFor) {
            const scheduled = new Date(newsletter.scheduledFor);
            setScheduledDate(scheduled.toISOString().split('T')[0]);
            setScheduledTime(scheduled.toTimeString().slice(0, 5));
        }
    }, []);

    function getNextSunday(): Date {
        const today = new Date();
        const day = today.getDay();
        const daysUntilSunday = day === 0 ? 7 : 7 - day;
        const nextSunday = new Date(today);
        nextSunday.setDate(today.getDate() + daysUntilSunday);
        nextSunday.setHours(9, 0, 0, 0);
        return nextSunday;
    }

    // Fetch available sponsors for search
    const fetchAvailableSponsors = async (query: string = '') => {
        setIsLoadingSponsors(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${config.backendUrl}admin/sponsors/all?page=1&limit=200&search=${encodeURIComponent(query)}&status=approved`,
                { headers: { 'x-auth-token': token } }
            );
            setAvailableSponsors(response.data.sponsors || []);
        } catch (error) {
            console.error('Failed to fetch sponsors:', error);
        } finally {
            setIsLoadingSponsors(false);
        }
    };

    useEffect(() => {
        if (showSponsorSearch) {
            fetchAvailableSponsors(searchQuery);
        }
    }, [showSponsorSearch, searchQuery]);

    const handleAddSponsor = (sponsor: Sponsor) => {
        const currentSponsors = editedNewsletter?.sponsors || [];
        if (!currentSponsors.find((s: any) => s._id === sponsor._id)) {
            setEditedNewsletter({
                ...editedNewsletter,
                sponsors: [...currentSponsors, sponsor]
            });
        }
        setShowSponsorSearch(false);
        setSearchQuery('');
    };

    const handleRemoveSponsor = (index: number) => {
        const currentSponsors = [...(editedNewsletter?.sponsors || [])];
        currentSponsors.splice(index, 1);
        setEditedNewsletter({
            ...editedNewsletter,
            sponsors: currentSponsors
        });
    };

    const handleReplaceSponsor = (index: number) => {
        setShowSponsorSearch(true);
        // Store index to replace after selection
        const replaceIndex = index;
        // We'll handle replacement in handleAddSponsor with a flag
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null) return;

        const sponsors = [...(editedNewsletter?.sponsors || [])];
        const draggedSponsor = sponsors[draggedIndex];
        sponsors.splice(draggedIndex, 1);
        sponsors.splice(index, 0, draggedSponsor);
        setEditedNewsletter({
            ...editedNewsletter,
            sponsors
        });
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleSaveDraft = () => {
        const updated = {
            ...editedNewsletter,
            subject,
            customIntro,
            status: 'draft'
        };
        onSave(updated);
    };

    const handleScheduleSend = () => {
        if (!scheduledDate || !scheduledTime) {
            alert('Please select a date and time for scheduling');
            return;
        }
        const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`);
        const updated = {
            ...editedNewsletter,
            subject,
            customIntro,
            scheduledFor,
            status: 'scheduled'
        };
        onSchedule(updated, scheduledFor);
    };

    const handleSendNow = () => {
        const confirmed = window.confirm(
            `Send this newsletter now?\n\nSubject: ${subject}\nRecipients: ${subscriberCount || 'Unknown'} subscribers\n\nThis action cannot be undone.`
        );
        if (!confirmed) return;

        const updated = {
            ...editedNewsletter,
            subject,
            customIntro,
            status: 'sent'
        };
        onSend(updated);
    };

    const handleSendTest = () => {
        const updated = {
            ...editedNewsletter,
            subject,
            customIntro
        };
        onSendTest(updated);
    };

    const getSponsorAudienceInfo = (sponsor: Sponsor) => {
        const newsletters = sponsor.newslettersSponsored || [];
        if (newsletters.length === 0) return null;

        const placements = newsletters.map(n => {
            const audience = n.estimatedAudience || 0;
            const audienceStr = audience >= 1000000 
                ? `${(audience / 1000000).toFixed(1)}M`
                : audience >= 1000
                ? `${(audience / 1000).toFixed(0)}K`
                : audience.toString();
            return `${n.newsletterName} (${audienceStr} ${n.contentTags?.[0] || 'readers'})`;
        }).slice(0, 3);

        return placements.join(', ');
    };

    const getAvgAudienceSize = (sponsor: Sponsor) => {
        if (sponsor.avgAudienceSize) {
            const avg = sponsor.avgAudienceSize;
            return avg >= 1000000 
                ? `${(avg / 1000000).toFixed(1)}M`
                : avg >= 1000
                ? `${(avg / 1000).toFixed(0)}K`
                : avg.toString();
        }
        return null;
    };

    const filteredSponsors = availableSponsors.filter(sponsor => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            sponsor.sponsorName.toLowerCase().includes(query) ||
            sponsor.rootDomain.toLowerCase().includes(query) ||
            sponsor.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    });

    return (
        <div className="newsletter-editor">
            <div className="newsletter-editor-header">
                <h2>
                    <FontAwesomeIcon icon={faNewspaper} />
                    Newsletter Editor
                </h2>
                <button className="btn-close" onClick={onClose}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className="newsletter-editor-content">
                {/* Subject Line */}
                <div className="editor-section">
                    <label>Subject Line</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter newsletter subject line"
                        className="subject-input"
                    />
                </div>

                {/* Custom Intro Editor */}
                <div className="editor-section">
                    <label>Custom Introduction (Optional)</label>
                    <textarea
                        value={customIntro}
                        onChange={(e) => setCustomIntro(e.target.value)}
                        placeholder="Add a custom intro message for this newsletter (supports markdown)"
                        className="intro-textarea"
                        rows={4}
                    />
                    <small>Supports markdown formatting. Leave empty to use default intro.</small>
                </div>

                {/* Schedule Picker */}
                <div className="editor-section">
                    <label>
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        Schedule Send
                    </label>
                    <div className="schedule-picker">
                        <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="date-input"
                        />
                        <input
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="time-input"
                        />
                        <button
                            className="btn-schedule-default"
                            onClick={() => {
                                const nextSunday = getNextSunday();
                                setScheduledDate(nextSunday.toISOString().split('T')[0]);
                                setScheduledTime('09:00');
                            }}
                        >
                            Next Sunday 9am
                        </button>
                    </div>
                </div>

                {/* Sponsor Selection */}
                <div className="editor-section">
                    <div className="section-header-row">
                        <label>Selected Sponsors ({editedNewsletter?.sponsors?.length || 0})</label>
                        <button
                            className="btn-add-sponsor"
                            onClick={() => setShowSponsorSearch(true)}
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Add Sponsor
                        </button>
                    </div>

                    <div className="sponsors-grid">
                        {(editedNewsletter?.sponsors || []).map((sponsor: Sponsor, index: number) => (
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
                                    <div className="sponsor-card-actions">
                                        <button
                                            className="btn-replace"
                                            onClick={() => handleReplaceSponsor(index)}
                                            title="Replace sponsor"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            className="btn-remove"
                                            onClick={() => handleRemoveSponsor(index)}
                                            title="Remove sponsor"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>

                                <div className="sponsor-card-content">
                                    <h3 className="sponsor-name">{sponsor.sponsorName}</h3>
                                    <div className="sponsor-domain">
                                        <FontAwesomeIcon icon={faExternalLink} />
                                        {sponsor.rootDomain}
                                    </div>

                                    {/* Contact Info */}
                                    <div className="sponsor-contact-info">
                                        {sponsor.contactPersonName && sponsor.contactPersonTitle ? (
                                            <div className="contact-detailed">
                                                <div className="contact-person">
                                                    <div className="contact-name">{sponsor.contactPersonName}</div>
                                                    <div className="contact-title">{sponsor.contactPersonTitle}</div>
                                                </div>
                                                <div className="contact-email">
                                                    <FontAwesomeIcon icon={faEnvelope} />
                                                    <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}{sponsor.contactPersonTitle ? ` (${sponsor.contactPersonTitle})` : ''}</a>
                                                </div>
                                                {sponsor.contactType === 'named_person' && (
                                                    <span className="contact-badge contact-badge-high">High Value</span>
                                                )}
                                            </div>
                                        ) : sponsor.sponsorEmail ? (
                                            <div className="contact-email">
                                                <FontAwesomeIcon icon={faEnvelope} />
                                                <a href={`mailto:${sponsor.sponsorEmail}`}>{sponsor.sponsorEmail}{sponsor.contactPersonTitle ? ` (${sponsor.contactPersonTitle})` : ''}</a>
                                            </div>
                                        ) : (
                                            <span className="no-contact">No contact info</span>
                                        )}
                                    </div>

                                    {/* Audience Fit Data */}
                                    <div className="sponsor-audience-data">
                                        {sponsor.tags && sponsor.tags.length > 0 && (
                                            <div className="audience-item">
                                                <FontAwesomeIcon icon={faTag} />
                                                <span>{sponsor.tags.slice(0, 3).join(', ')}</span>
                                            </div>
                                        )}

                                        {getSponsorAudienceInfo(sponsor) && (
                                            <div className="audience-item">
                                                <FontAwesomeIcon icon={faNewspaper} />
                                                <span className="audience-text">
                                                    Sponsored: {getSponsorAudienceInfo(sponsor)}
                                                </span>
                                            </div>
                                        )}

                                        {getAvgAudienceSize(sponsor) && (
                                            <div className="audience-item">
                                                <FontAwesomeIcon icon={faUsers} />
                                                <span>Avg audience: {getAvgAudienceSize(sponsor)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recipient Preview */}
                <div className="editor-section recipient-preview">
                    <div className="preview-header">
                        <label>
                            <FontAwesomeIcon icon={faUsers} />
                            Recipient Preview
                        </label>
                        <button
                            className="btn-preview-toggle"
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            <FontAwesomeIcon icon={showPreview ? faEyeSlash : faEye} />
                            {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                    </div>

                    <div className="preview-info">
                        <p>
                            <strong>Will send to {subscriberCount || 'X'} subscribers</strong>
                            {scheduledDate && scheduledTime && (
                                <span> on {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}</span>
                            )}
                        </p>
                        <button
                            className="btn-test-email"
                            onClick={handleSendTest}
                        >
                            <FontAwesomeIcon icon={faEnvelope} />
                            Send Test Email
                        </button>
                    </div>

                    {showPreview && (
                        <div className="email-preview">
                            <div className="preview-subject">
                                <strong>Subject:</strong> {subject || '(No subject)'}
                            </div>
                            <div className="preview-content">
                                <p><strong>Hi [Name],</strong></p>
                                {customIntro ? (
                                    <div className="custom-intro-preview">{customIntro}</div>
                                ) : (
                                    <p>Here are some verified sponsors from SponsorDB this week:</p>
                                )}
                                {/* Preview sponsor cards */}
                                {(editedNewsletter?.sponsors || []).slice(0, 4).map((sponsor: Sponsor, index: number) => (
                                    <div key={sponsor._id || index} className="preview-sponsor-card">
                                        <h4>{sponsor.sponsorName}</h4>
                                        <p>{sponsor.rootDomain}</p>
                                        {sponsor.sponsorEmail && (
                                            <p>Contact: {sponsor.sponsorEmail}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="editor-actions">
                    <button
                        className="btn-action btn-save-draft"
                        onClick={handleSaveDraft}
                    >
                        <FontAwesomeIcon icon={faSave} />
                        Save Draft
                    </button>
                    <button
                        className="btn-action btn-schedule"
                        onClick={handleScheduleSend}
                        disabled={!scheduledDate || !scheduledTime}
                    >
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        Schedule Send
                    </button>
                    <button
                        className="btn-action btn-send-now"
                        onClick={handleSendNow}
                    >
                        <FontAwesomeIcon icon={faPaperPlane} />
                        Send Now
                    </button>
                </div>
            </div>

            {/* Sponsor Search Modal */}
            {showSponsorSearch && (
                <div className="sponsor-search-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Add Sponsor</h3>
                            <button className="btn-close" onClick={() => {
                                setShowSponsorSearch(false);
                                setSearchQuery('');
                            }}>
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
                        <div className="modal-sponsors-list">
                            {isLoadingSponsors ? (
                                <div className="loading">
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    Loading sponsors...
                                </div>
                            ) : filteredSponsors.length === 0 ? (
                                <div className="no-results">No sponsors found</div>
                            ) : (
                                filteredSponsors.map((sponsor) => (
                                    <div
                                        key={sponsor._id}
                                        className="sponsor-search-item"
                                        onClick={() => handleAddSponsor(sponsor)}
                                    >
                                        <div className="search-item-header">
                                            <strong>{sponsor.sponsorName}</strong>
                                            <span className="search-item-domain">{sponsor.rootDomain}</span>
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
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsletterEditor;

