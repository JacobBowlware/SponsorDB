import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import '../css/EditSponsorModal.css';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    rootDomain: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    sponsorEmail?: string;
    sponsorApplication?: string;
    businessContact?: string;
    contactMethod: 'email' | 'application' | 'both' | 'none';
    confidence: number;
    analysisStatus: 'complete' | 'manual_review_required' | 'pending';
    dateAdded: string;
    status?: 'pending' | 'approved' | 'rejected' | 'reviewed';
    // Affiliate program fields
    isAffiliateProgram?: boolean;
    affiliateSignupLink?: string;
    commissionInfo?: string;
    interestedUsers?: string[];
}

interface EditSponsorModalProps {
    sponsor: Sponsor;
    onClose: () => void;
    onSave: (updatedSponsor: Sponsor) => void;
}

const EditSponsorModal: React.FC<EditSponsorModalProps> = ({ sponsor, onClose, onSave }) => {
    const [editedSponsor, setEditedSponsor] = useState<Sponsor>(sponsor);
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        
        if (!editedSponsor.sponsorName.trim()) {
            newErrors.sponsorName = 'Sponsor name is required';
        }
        
        if (editedSponsor.sponsorEmail && !editedSponsor.sponsorEmail.includes('@')) {
            newErrors.sponsorEmail = 'Please enter a valid email address';
        }
        
        if (editedSponsor.sponsorApplication && !editedSponsor.sponsorApplication.startsWith('http')) {
            newErrors.sponsorApplication = 'Please enter a valid URL starting with http:// or https://';
        }
        
        if (editedSponsor.affiliateSignupLink && !editedSponsor.affiliateSignupLink.startsWith('http')) {
            newErrors.affiliateSignupLink = 'Please enter a valid URL starting with http:// or https://';
        }
        
        if (editedSponsor.subscriberCount && editedSponsor.subscriberCount < 0) {
            newErrors.subscriberCount = 'Subscriber count must be a positive number';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('EditSponsorModal: Form submitted');
        console.log('EditSponsorModal: editedSponsor:', editedSponsor);
        if (validateForm()) {
            console.log('EditSponsorModal: Validation passed, calling onSave');
            onSave(editedSponsor);
        } else {
            console.log('EditSponsorModal: Validation failed');
        }
    };

    return (
        <div className="edit-modal-overlay">
            <div className="edit-modal">
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
                                    value={editedSponsor.sponsorLink || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, sponsorLink: e.target.value})}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="edit-modal__field">
                                <label>Root Domain</label>
                                <input
                                    type="text"
                                    value={editedSponsor.rootDomain || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, rootDomain: e.target.value})}
                                    placeholder="example.com"
                                />
                            </div>
                            <div className="edit-modal__field">
                                <label>Newsletter Sponsored</label>
                                <input
                                    type="text"
                                    value={editedSponsor.newsletterSponsored || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, newsletterSponsored: e.target.value})}
                                    placeholder="Newsletter name"
                                />
                            </div>
                            <div className="edit-modal__field">
                                <label>Subscriber Count</label>
                                <input
                                    type="number"
                                    value={editedSponsor.subscriberCount || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, subscriberCount: parseInt(e.target.value) || 0})}
                                    className={errors.subscriberCount ? 'error' : ''}
                                    placeholder="0"
                                />
                                {errors.subscriberCount && <span className="error-message">{errors.subscriberCount}</span>}
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div className="edit-modal__section">
                            <h4 className="edit-modal__section-title">Contact Information</h4>
                            <div className="edit-modal__field">
                                <label>Contact Method</label>
                                <select
                                    value={editedSponsor.contactMethod}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, contactMethod: e.target.value as 'email' | 'application' | 'both' | 'none'})}
                                >
                                    <option value="none">No Contact</option>
                                    <option value="email">Email Only</option>
                                    <option value="application">Application Only</option>
                                    <option value="both">Both Email & Application</option>
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
                                <label>Sponsor Application URL</label>
                                <input
                                    type="url"
                                    value={editedSponsor.sponsorApplication || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, sponsorApplication: e.target.value})}
                                    placeholder="https://example.com/apply"
                                    className={errors.sponsorApplication ? 'error' : ''}
                                />
                                {errors.sponsorApplication && <span className="error-message">{errors.sponsorApplication}</span>}
                            </div>
                            <div className="edit-modal__field">
                                <label>Legacy Business Contact</label>
                                <input
                                    type="text"
                                    value={editedSponsor.businessContact || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, businessContact: e.target.value})}
                                    placeholder="Legacy contact field"
                                />
                            </div>
                        </div>

                        {/* Affiliate Program Section */}
                        <div className="edit-modal__section">
                            <h4 className="edit-modal__section-title">Affiliate Program</h4>
                            <div className="edit-modal__field">
                                <label className="edit-modal__checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={editedSponsor.isAffiliateProgram || false}
                                        onChange={(e) => setEditedSponsor({...editedSponsor, isAffiliateProgram: e.target.checked})}
                                    />
                                    <span>This is an affiliate program</span>
                                </label>
                            </div>
                            <div className="edit-modal__field">
                                <label>Affiliate Signup Link</label>
                                <input
                                    type="url"
                                    value={editedSponsor.affiliateSignupLink || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, affiliateSignupLink: e.target.value})}
                                    placeholder="https://example.com/affiliate"
                                    className={errors.affiliateSignupLink ? 'error' : ''}
                                />
                                {errors.affiliateSignupLink && <span className="error-message">{errors.affiliateSignupLink}</span>}
                            </div>
                            <div className="edit-modal__field">
                                <label>Commission Information</label>
                                <textarea
                                    value={editedSponsor.commissionInfo || ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, commissionInfo: e.target.value})}
                                    placeholder="Commission rates, terms, etc."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Status & Classification Section */}
                        <div className="edit-modal__section">
                            <h4 className="edit-modal__section-title">Status & Classification</h4>
                            <div className="edit-modal__field">
                                <label>Status</label>
                                <select
                                    value={editedSponsor.status || 'pending'}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, status: e.target.value as 'pending' | 'approved' | 'rejected' | 'reviewed'})}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="reviewed">Reviewed</option>
                                </select>
                            </div>
                            <div className="edit-modal__field">
                                <label>Analysis Status</label>
                                <select
                                    value={editedSponsor.analysisStatus}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, analysisStatus: e.target.value as 'complete' | 'manual_review_required' | 'pending'})}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="manual_review_required">Manual Review Required</option>
                                    <option value="complete">Complete</option>
                                </select>
                            </div>
                            <div className="edit-modal__field">
                                <label>Confidence Score</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editedSponsor.confidence || 0}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, confidence: parseInt(e.target.value) || 0})}
                                    placeholder="0-100"
                                />
                            </div>
                            <div className="edit-modal__field">
                                <label>Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    value={editedSponsor.tags ? editedSponsor.tags.join(', ') : ''}
                                    onChange={(e) => setEditedSponsor({...editedSponsor, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)})}
                                    placeholder="SaaS, B2B, AI, etc."
                                />
                            </div>
                        </div>
                    </div>
                    <div className="edit-modal__footer">
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