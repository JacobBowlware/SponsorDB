import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import '../css/EditSponsorModal.css';

interface NewsletterSponsored {
    newsletterName: string;
    estimatedAudience: number;
    contentTags: string[];
    dateSponsored: string | Date;
    emailAddress?: string;
}

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    newsletterSponsored: string; // Legacy field for backward compatibility
    subscriberCount: number; // Legacy field
    dateSponsored?: string | Date;
    sponsorEmail?: string;
    businessContact?: string;
    contactMethod: 'email' | 'none';
    contactPersonName?: string;
    contactPersonTitle?: string;
    contactType?: 'named_person' | 'business_email' | 'generic_email' | 'not_found';
    confidence?: number;
    dateAdded: string;
    status: 'pending' | 'approved';
    // New structure fields
    newslettersSponsored?: NewsletterSponsored[];
    contentTags?: string[];
    totalPlacements?: number;
    avgAudienceSize?: number;
    mostRecentNewsletterDate?: string | Date;
    isViewed?: boolean;
    isApplied?: boolean;
    dateViewed?: string | Date;
    dateApplied?: string | Date;
}

interface EditSponsorModalProps {
    sponsor: Sponsor;
    onClose: () => void;
    onSave: (updatedSponsor: Sponsor) => void;
    onConvertToAffiliate?: (sponsorId: string) => Promise<void>;
}

const EditSponsorModal: React.FC<EditSponsorModalProps> = ({ sponsor, onClose, onSave, onConvertToAffiliate }) => {
    // Initialize newslettersSponsored array, ensuring it's always an array and all required fields are present
    const initialNewsletters = sponsor.newslettersSponsored && sponsor.newslettersSponsored.length > 0 
        ? sponsor.newslettersSponsored.map(n => ({
            newsletterName: n.newsletterName || '',
            estimatedAudience: n.estimatedAudience ?? 0,
            contentTags: n.contentTags || [],
            dateSponsored: n.dateSponsored || new Date().toISOString(),
            emailAddress: n.emailAddress
        }))
        : [];

    const [editedSponsor, setEditedSponsor] = useState<Sponsor>({
        ...sponsor,
        sponsorLink: sponsor.sponsorLink || '',
        rootDomain: sponsor.rootDomain || '',
        tags: sponsor.tags || [],
        newsletterSponsored: sponsor.newsletterSponsored || '',
        subscriberCount: sponsor.subscriberCount || 0,
        newslettersSponsored: initialNewsletters
    });
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isConverting, setIsConverting] = useState(false);

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        
        if (!editedSponsor.sponsorName.trim()) {
            newErrors.sponsorName = 'Sponsor name is required';
        }
        
        if (editedSponsor.sponsorEmail && !editedSponsor.sponsorEmail.includes('@')) {
            newErrors.sponsorEmail = 'Please enter a valid email address';
        }
        
        if (editedSponsor.businessContact && editedSponsor.businessContact.includes('@') && !editedSponsor.businessContact.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.businessContact = 'Please enter a valid email address';
        }

        // Validate newsletters
        if (editedSponsor.newslettersSponsored) {
            editedSponsor.newslettersSponsored.forEach((newsletter, index) => {
                if (!newsletter.newsletterName || newsletter.newsletterName.trim() === '') {
                    newErrors[`newsletter_${index}_name`] = 'Newsletter name is required';
                }
                if (newsletter.estimatedAudience && newsletter.estimatedAudience < 0) {
                    newErrors[`newsletter_${index}_audience`] = 'Audience size must be positive';
                }
                if (newsletter.emailAddress && !newsletter.emailAddress.includes('@')) {
                    newErrors[`newsletter_${index}_email`] = 'Please enter a valid email address';
                }
            });
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Clean up the data before saving
            const cleanedSponsor = {
                ...editedSponsor,
                newslettersSponsored: editedSponsor.newslettersSponsored?.filter(n => n.newsletterName.trim() !== '')
            };
            onSave(cleanedSponsor);
        }
    };

    const handleConvertToAffiliate = async () => {
        if (!onConvertToAffiliate) return;
        
        if (!window.confirm(`Convert "${editedSponsor.sponsorName}" to an affiliate program? This will move it from sponsors to affiliates.`)) {
            return;
        }
        
        try {
            setIsConverting(true);
            await onConvertToAffiliate(editedSponsor._id);
            onClose();
        } catch (error) {
            alert('Failed to convert sponsor to affiliate. Please try again.');
        } finally {
            setIsConverting(false);
        }
    };

    const addNewsletter = () => {
        const newNewsletter: NewsletterSponsored = {
            newsletterName: '',
            estimatedAudience: 0,
            contentTags: [],
            dateSponsored: new Date().toISOString(),
            emailAddress: ''
        };
        setEditedSponsor({
            ...editedSponsor,
            newslettersSponsored: [...(editedSponsor.newslettersSponsored || []), newNewsletter]
        });
    };

    const removeNewsletter = (index: number) => {
        const updatedNewsletters = [...(editedSponsor.newslettersSponsored || [])];
        updatedNewsletters.splice(index, 1);
        setEditedSponsor({
            ...editedSponsor,
            newslettersSponsored: updatedNewsletters
        });
    };

    const updateNewsletter = (index: number, field: keyof NewsletterSponsored, value: any) => {
        const updatedNewsletters = [...(editedSponsor.newslettersSponsored || [])];
        updatedNewsletters[index] = {
            ...updatedNewsletters[index],
            [field]: value
        };
        setEditedSponsor({
            ...editedSponsor,
            newslettersSponsored: updatedNewsletters
        });
    };

    const updateNewsletterTags = (index: number, tagsString: string) => {
        const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        updateNewsletter(index, 'contentTags', tags);
    };

    const formatDateForInput = (date: string | Date | undefined): string => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal edit-modal-large">
                <div className="edit-modal__header">
                    <h3>Edit Sponsor</h3>
                    <button className="edit-modal__close" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="edit-modal__content">
                        {/* Basic Information Section */}
                        <div className="edit-modal__section">
                            <h4 className="edit-modal__section-title">Basic Information</h4>
                            <div className="edit-modal__field">
                                <label>Sponsor Name *</label>
                                <input
                                    type="text"
                                    value={editedSponsor.sponsorName}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, sponsorName: e.target.value})}
                                    className={errors.sponsorName ? 'error' : ''}
                                    placeholder="Enter sponsor company name"
                                />
                                {errors.sponsorName && <span className="error-message">{errors.sponsorName}</span>}
                            </div>
                            <div className="edit-modal__field">
                                <label>Sponsor Website</label>
                                <input
                                    type="url"
                                    value={editedSponsor.sponsorLink}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, sponsorLink: e.target.value})}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="edit-modal__field">
                                <label>Root Domain</label>
                                <input
                                    type="text"
                                    value={editedSponsor.rootDomain}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, rootDomain: e.target.value})}
                                    placeholder="example.com"
                                />
                            </div>
                            <div className="edit-modal__field">
                                <label>Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={editedSponsor.tags.join(', ')}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)})}
                                    placeholder="SaaS, B2B, AI, etc."
                                />
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div className="edit-modal__section">
                            <h4 className="edit-modal__section-title">Contact Information</h4>
                            <div className="edit-modal__field">
                                <label>Contact Method</label>
                                <select
                                    value={editedSponsor.contactMethod || 'none'}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, contactMethod: e.target.value as 'email' | 'none'})}
                                >
                                    <option value="none">No Contact</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>
                            <div className="edit-modal__field">
                                <label>Sponsor Email</label>
                                <input
                                    type="email"
                                    value={editedSponsor.sponsorEmail || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, sponsorEmail: e.target.value})}
                                    placeholder="contact@example.com"
                                    className={errors.sponsorEmail ? 'error' : ''}
                                />
                                {errors.sponsorEmail && <span className="error-message">{errors.sponsorEmail}</span>}
                            </div>
                            <div className="edit-modal__field">
                                <label>Business Contact</label>
                                <input
                                    type="email"
                                    value={editedSponsor.businessContact || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, businessContact: e.target.value})}
                                    placeholder="business@example.com"
                                    className={errors.businessContact ? 'error' : ''}
                                />
                                {errors.businessContact && <span className="error-message">{errors.businessContact}</span>}
                            </div>
                            <div className="edit-modal__field">
                                <label>Contact Person Name</label>
                                <input
                                    type="text"
                                    value={editedSponsor.contactPersonName || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, contactPersonName: e.target.value})}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="edit-modal__field">
                                <label>Contact Person Title</label>
                                <input
                                    type="text"
                                    value={editedSponsor.contactPersonTitle || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, contactPersonTitle: e.target.value})}
                                    placeholder="Head of Partnerships"
                                />
                            </div>
                            <div className="edit-modal__field">
                                <label>Contact Type</label>
                                <select
                                    value={editedSponsor.contactType || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, contactType: e.target.value as any})}
                                >
                                    <option value="">Not Set</option>
                                    <option value="named_person">Named Person</option>
                                    <option value="business_email">Business Email</option>
                                    <option value="generic_email">Generic Email</option>
                                    <option value="not_found">Not Found</option>
                                </select>
                            </div>
                        </div>

                        {/* Newsletter Sponsorships Section */}
                        <div className="edit-modal__section">
                            <div className="edit-modal__section-header">
                                <h4 className="edit-modal__section-title">Newsletter Sponsorships</h4>
                                <button 
                                    type="button" 
                                    className="edit-modal__add-btn"
                                    onClick={addNewsletter}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Add Newsletter
                                </button>
                            </div>
                            
                            {editedSponsor.newslettersSponsored && editedSponsor.newslettersSponsored.length > 0 ? (
                                <div className="edit-modal__newsletters-list">
                                    {editedSponsor.newslettersSponsored.map((newsletter, index) => (
                                        <div key={index} className="edit-modal__newsletter-item">
                                            <div className="edit-modal__newsletter-header">
                                                <h5>Newsletter #{index + 1}</h5>
                                                <button
                                                    type="button"
                                                    className="edit-modal__remove-btn"
                                                    onClick={() => removeNewsletter(index)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </div>
                                            
                                            <div className="edit-modal__field">
                                                <label>Newsletter Name *</label>
                                                <input
                                                    type="text"
                                                    value={newsletter.newsletterName || ''}
                                                    onChange={(e) => updateNewsletter(index, 'newsletterName', e.target.value)}
                                                    className={errors[`newsletter_${index}_name`] ? 'error' : ''}
                                                    placeholder="Newsletter Name"
                                                />
                                                {errors[`newsletter_${index}_name`] && (
                                                    <span className="error-message">{errors[`newsletter_${index}_name`]}</span>
                                                )}
                                            </div>

                                            <div className="edit-modal__field-row">
                                                <div className="edit-modal__field">
                                                    <label>Estimated Audience</label>
                                                    <input
                                                        type="number"
                                                        value={newsletter.estimatedAudience}
                                                        onChange={(e) => updateNewsletter(index, 'estimatedAudience', parseInt(e.target.value) || 0)}
                                                        className={errors[`newsletter_${index}_audience`] ? 'error' : ''}
                                                        placeholder="100000"
                                                        min="0"
                                                    />
                                                    {errors[`newsletter_${index}_audience`] && (
                                                        <span className="error-message">{errors[`newsletter_${index}_audience`]}</span>
                                                    )}
                                                </div>

                                                <div className="edit-modal__field">
                                                    <label>Date Sponsored</label>
                                                    <input
                                                        type="date"
                                                        value={formatDateForInput(newsletter.dateSponsored)}
                                                        onChange={(e) => updateNewsletter(index, 'dateSponsored', e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString())}
                                                    />
                                                </div>
                                            </div>

                                            <div className="edit-modal__field">
                                                <label>Content Tags (comma-separated)</label>
                                                <input
                                                    type="text"
                                                    value={newsletter.contentTags.join(', ')}
                                                    onChange={(e) => updateNewsletterTags(index, e.target.value)}
                                                    placeholder="AI, Tech, SaaS"
                                                />
                                            </div>

                                            <div className="edit-modal__field">
                                                <label>Email Address</label>
                                                <input
                                                    type="email"
                                                    value={newsletter.emailAddress || ''}
                                                    onChange={(e) => updateNewsletter(index, 'emailAddress', e.target.value)}
                                                    className={errors[`newsletter_${index}_email`] ? 'error' : ''}
                                                    placeholder="newsletter@example.com"
                                                />
                                                {errors[`newsletter_${index}_email`] && (
                                                    <span className="error-message">{errors[`newsletter_${index}_email`]}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="edit-modal__empty-state">
                                    <p>No newsletters added yet. Click "Add Newsletter" to add one.</p>
                                </div>
                            )}
                        </div>

                        {/* Status & Classification Section */}
                        <div className="edit-modal__section">
                            <h4 className="edit-modal__section-title">Status & Classification</h4>
                            <div className="edit-modal__field">
                                <label>Status</label>
                                <select
                                    value={editedSponsor.status}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, status: e.target.value as 'pending' | 'approved'})}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                </select>
                            </div>
                            <div className="edit-modal__field">
                                <label>Confidence Score (0-1)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={editedSponsor.confidence !== undefined ? editedSponsor.confidence : ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, confidence: e.target.value ? parseFloat(e.target.value) : undefined})}
                                    placeholder="0.0-1.0"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="edit-modal__footer">
                        {onConvertToAffiliate && (
                            <button 
                                type="button" 
                                className="edit-modal__convert"
                                onClick={handleConvertToAffiliate}
                                disabled={isConverting}
                            >
                                {isConverting ? 'Converting...' : 'Convert to Affiliate'}
                            </button>
                        )}
                        <button type="button" className="edit-modal__cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="edit-modal__save">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSponsorModal;