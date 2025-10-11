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
    contactMethod: 'email' | 'application' | 'both' | 'none';
    confidence: number;
    analysisStatus: 'complete' | 'manual_review_required' | 'pending';
    dateAdded: string;
    status?: 'pending' | 'approved' | 'rejected' | 'reviewed';
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
        
        if (editedSponsor.subscriberCount && editedSponsor.subscriberCount < 0) {
            newErrors.subscriberCount = 'Subscriber count must be a positive number';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSave(editedSponsor);
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
                        <div className="edit-modal__field">
                            <label>Sponsor Name</label>
                            <input
                                type="text"
                                value={editedSponsor.sponsorName}
                                onChange={(e) => setEditedSponsor({...editedSponsor, sponsorName: e.target.value})}
                                className={errors.sponsorName ? 'error' : ''}
                            />
                            {errors.sponsorName && <span className="error-message">{errors.sponsorName}</span>}
                        </div>
                        <div className="edit-modal__field">
                            <label>Sponsor Link</label>
                            <input
                                type="url"
                                value={editedSponsor.sponsorLink || ''}
                                onChange={(e) => setEditedSponsor({...editedSponsor, sponsorLink: e.target.value})}
                            />
                        </div>
                        <div className="edit-modal__field">
                            <label>Root Domain</label>
                            <input
                                type="text"
                                value={editedSponsor.rootDomain || ''}
                                onChange={(e) => setEditedSponsor({...editedSponsor, rootDomain: e.target.value})}
                            />
                        </div>
                        <div className="edit-modal__field">
                            <label>Newsletter</label>
                            <input
                                type="text"
                                value={editedSponsor.newsletterSponsored || ''}
                                onChange={(e) => setEditedSponsor({...editedSponsor, newsletterSponsored: e.target.value})}
                            />
                        </div>
                        <div className="edit-modal__field">
                            <label>Subscriber Count</label>
                            <input
                                type="number"
                                value={editedSponsor.subscriberCount || ''}
                                onChange={(e) => setEditedSponsor({...editedSponsor, subscriberCount: parseInt(e.target.value) || 0})}
                                className={errors.subscriberCount ? 'error' : ''}
                            />
                            {errors.subscriberCount && <span className="error-message">{errors.subscriberCount}</span>}
                        </div>
                        <div className="edit-modal__field">
                            <label>Sponsor Email</label>
                            <input
                                type="email"
                                value={editedSponsor.sponsorEmail || ''}
                                onChange={(e) => setEditedSponsor({...editedSponsor, sponsorEmail: e.target.value})}
                                placeholder="Enter sponsor email address"
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
                                placeholder="Enter application URL"
                                className={errors.sponsorApplication ? 'error' : ''}
                            />
                            {errors.sponsorApplication && <span className="error-message">{errors.sponsorApplication}</span>}
                        </div>
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
                            <label>Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={editedSponsor.tags ? editedSponsor.tags.join(', ') : ''}
                                onChange={(e) => setEditedSponsor({...editedSponsor, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)})}
                                placeholder="Enter tags separated by commas"
                            />
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