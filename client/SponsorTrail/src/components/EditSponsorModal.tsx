import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './EditSponsorModal.css';

interface Sponsor {
    _id: string;
    sponsorName: string;
    sponsorLink: string;
    tags: string[];
    newsletterSponsored: string;
    subscriberCount: number;
    businessContact: string;
    dateAdded: string;
}

interface EditSponsorModalProps {
    sponsor: Sponsor;
    onClose: () => void;
    onSave: (updatedSponsor: Sponsor) => void;
}

const EditSponsorModal: React.FC<EditSponsorModalProps> = ({ sponsor, onClose, onSave }) => {
    const [editedSponsor, setEditedSponsor] = useState<Sponsor>(sponsor);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedSponsor);
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
                            />
                        </div>
                        <div className="edit-modal__field">
                            <label>Sponsor Link</label>
                            <input
                                type="url"
                                value={editedSponsor.sponsorLink}
                                onChange={(e) => setEditedSponsor({...editedSponsor, sponsorLink: e.target.value})}
                            />
                        </div>
                        <div className="edit-modal__field">
                            <label>Newsletter</label>
                            <input
                                type="text"
                                value={editedSponsor.newsletterSponsored}
                                onChange={(e) => setEditedSponsor({...editedSponsor, newsletterSponsored: e.target.value})}
                            />
                        </div>
                        <div className="edit-modal__field">
                            <label>Subscriber Count</label>
                            <input
                                type="number"
                                value={editedSponsor.subscriberCount}
                                onChange={(e) => setEditedSponsor({...editedSponsor, subscriberCount: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <div className="edit-modal__field">
                            <label>Business Contact</label>
                            <input
                                type="text"
                                value={editedSponsor.businessContact}
                                onChange={(e) => setEditedSponsor({...editedSponsor, businessContact: e.target.value})}
                            />
                        </div>
                        <div className="edit-modal__field">
                            <label>Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={editedSponsor.tags.join(', ')}
                                onChange={(e) => setEditedSponsor({...editedSponsor, tags: e.target.value.split(',').map(tag => tag.trim())})}
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