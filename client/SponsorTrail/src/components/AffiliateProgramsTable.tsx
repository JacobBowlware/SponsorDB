import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faCopy, 
    faHeart, 
    faExternalLinkAlt,
    faTag,
    faDollarSign,
    faBuilding,
    faCalendarAlt,
    faCheckCircle,
    faSpinner
} from "@fortawesome/free-solid-svg-icons";
import axios from 'axios';
import config from '../config';

interface AffiliateProgram {
    _id: string;
    sponsorName: string;
    affiliateSignupLink?: string;
    sponsorLink?: string;
    businessContact?: string;
    sponsorEmail?: string;
    sponsorApplication?: string;
    commissionInfo?: string;
    rootDomain: string;
    tags: string[];
    dateAdded: string;
    interestedUsers: string[];
}

interface AffiliateProgramsTableProps {
    onError: (error: string) => void;
    user?: {
        email: string;
        newsletterInfo?: {
            name?: string;
            topic?: string;
            audience_size?: number;
            engagement_rate?: number;
            publishing_frequency?: string;
            audience_demographics?: {
                age_range?: string;
                income_range?: string;
                location?: string;
                interests?: string[];
                job_titles?: string[];
            };
        } | null;
    };
}

const AffiliateProgramsTable: React.FC<AffiliateProgramsTableProps> = ({ onError, user }) => {
    // Component for displaying affiliate programs
    const [affiliatePrograms, setAffiliatePrograms] = useState<AffiliateProgram[]>([]);
    const [loading, setLoading] = useState(false);
    const [interestedPrograms, setInterestedPrograms] = useState<Set<string>>(new Set());

    // Helper function to get the best available signup link
    const getSignupLink = (program: AffiliateProgram): string | null => {
        // Priority order: affiliateSignupLink > businessContact > sponsorApplication > sponsorLink
        if (program.affiliateSignupLink && program.affiliateSignupLink.trim() !== '') {
            return program.affiliateSignupLink;
        }
        if (program.businessContact && program.businessContact.trim() !== '') {
            return program.businessContact;
        }
        if (program.sponsorApplication && program.sponsorApplication.trim() !== '') {
            return program.sponsorApplication;
        }
        if (program.sponsorLink && program.sponsorLink.trim() !== '') {
            return program.sponsorLink;
        }
        return null;
    };

    const fetchAffiliatePrograms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }

            const response = await axios.get(`${config.backendUrl}sponsors`, {
                headers: {
                    'x-auth-token': token
                },
                params: {
                    affiliateOnly: 'true'
                }
            });

            setAffiliatePrograms(response.data);
            
            // Debug: Log the affiliate programs data to see what we're getting
            console.log('Affiliate programs data:', response.data);
            response.data.forEach((program: AffiliateProgram, index: number) => {
                const signupLink = getSignupLink(program);
                console.log(`Program ${index + 1}:`, {
                    name: program.sponsorName,
                    affiliateSignupLink: program.affiliateSignupLink,
                    sponsorApplication: program.sponsorApplication,
                    sponsorLink: program.sponsorLink,
                    businessContact: program.businessContact,
                    bestLink: signupLink,
                    domain: program.rootDomain,
                    commission: program.commissionInfo
                });
            });
            
            // Track which programs the user is interested in
            // Note: This requires user._id which may not be available in the current user object
            // For now, we'll skip this functionality until user ID is properly available
            // if (user?._id) {
            //     const userInterested = response.data
            //         .filter((program: AffiliateProgram) => program.interestedUsers.includes(user._id))
            //         .map((program: AffiliateProgram) => program._id);
            //     setInterestedPrograms(new Set(userInterested));
            // }
        } catch (err: any) {
            console.error('Error fetching affiliate programs:', err);
            onError('Failed to load affiliate programs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAffiliatePrograms();
    }, []); // Remove user?._id dependency since it's not available

    const handleCopyLink = async (program: AffiliateProgram) => {
        try {
            const link = getSignupLink(program);
            
            // Validate link before copying
            if (!link || link.trim() === '' || link === 'about:blank') {
                onError('No signup link available to copy');
                return;
            }
            
            // Add https:// if no protocol is specified
            let validLink = link;
            if (!link.startsWith('http://') && !link.startsWith('https://')) {
                validLink = `https://${link}`;
            }
            
            await navigator.clipboard.writeText(validLink);
            // You could add a toast notification here
            console.log(`Copied ${program.sponsorName} signup link to clipboard`);
        } catch (err) {
            console.error('Failed to copy link:', err);
            onError('Failed to copy link to clipboard');
        }
    };

    const handleMarkInterested = async (programId: string) => {
        try {
            // Note: This functionality requires user._id which may not be available
            // For now, we'll just show a message that this feature is not available
            onError('Mark as interested feature requires user authentication - coming soon!');
            return;

            // if (!user?._id) {
            //     onError('User ID not available');
            //     return;
            // }

            // const token = localStorage.getItem('token');
            // if (!token) return;

            // await axios.post(`${config.backendUrl}admin/sponsors/${programId}/mark-interested`, {}, {
            //     headers: {
            //         'x-auth-token': token
            //     }
            // });

            // setInterestedPrograms(prev => new Set([...prev, programId]));
        } catch (err: any) {
            console.error('Error marking as interested:', err);
            onError('Failed to mark as interested');
        }
    };

    const handleOpenLink = (program: AffiliateProgram) => {
        const link = getSignupLink(program);
        
        // If link is empty or invalid, show error
        if (!link || link.trim() === '' || link === 'about:blank') {
            onError('No signup link available for this affiliate program');
            return;
        }
        
        // Add https:// if no protocol is specified
        let validLink = link;
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
            validLink = `https://${link}`;
        }
        
        // Validate URL format
        try {
            new URL(validLink);
            window.open(validLink, '_blank', 'noopener,noreferrer');
        } catch (error) {
            onError('Invalid signup link format');
        }
    };

    if (loading) {
        return (
            <div className="affiliate-programs-loading">
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Loading affiliate programs...</span>
            </div>
        );
    }

    if (affiliatePrograms.length === 0) {
        return (
            <div className="affiliate-programs-empty">
                <FontAwesomeIcon icon={faTag} />
                <h3>No Affiliate Programs Found</h3>
                <p>There are currently no affiliate programs available. Check back later for updates!</p>
            </div>
        );
    }

    return (
        <div className="affiliate-programs-table">
            <div className="affiliate-programs-header">
                <h3>Affiliate Programs</h3>
                <div className="affiliate-programs-count">
                    {affiliatePrograms.length} program{affiliatePrograms.length !== 1 ? 's' : ''} available
                </div>
            </div>

            <div className="affiliate-programs-grid">
                {affiliatePrograms.map((program) => (
                    <div key={program._id} className="affiliate-program-card">
                        <div className="affiliate-program-header">
                            <div className="affiliate-program-name">
                                <FontAwesomeIcon icon={faBuilding} />
                                <span>{program.sponsorName}</span>
                            </div>
                            <div className="affiliate-program-badge">
                                <FontAwesomeIcon icon={faTag} />
                                <span>Affiliate Program</span>
                            </div>
                        </div>

                        <div className="affiliate-program-domain">
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                            {getSignupLink(program) ? (
                                <a 
                                    href={getSignupLink(program)!.startsWith('http') ? getSignupLink(program)! : `https://${getSignupLink(program)!}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="affiliate-domain-link"
                                >
                                    {program.rootDomain}
                                </a>
                            ) : (
                                <span>{program.rootDomain}</span>
                            )}
                        </div>

                        {program.commissionInfo && (
                            <div className="affiliate-program-commission">
                                <FontAwesomeIcon icon={faDollarSign} />
                                <span>{program.commissionInfo}</span>
                            </div>
                        )}

                        {program.tags && program.tags.length > 0 && (
                            <div className="affiliate-program-tags">
                                {program.tags.map((tag, index) => (
                                    <span key={index} className="affiliate-program-tag">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="affiliate-program-actions">
                            <button
                                className={`affiliate-action-btn affiliate-action-btn--copy ${
                                    !getSignupLink(program) ? 'disabled' : ''
                                }`}
                                onClick={() => handleCopyLink(program)}
                                title={!getSignupLink(program) ? 'No signup link available' : 'Copy signup link'}
                                disabled={!getSignupLink(program)}
                            >
                                <FontAwesomeIcon icon={faCopy} />
                                Copy Link
                            </button>

                            <button
                                className={`affiliate-action-btn affiliate-action-btn--open ${
                                    !getSignupLink(program) ? 'disabled' : ''
                                }`}
                                onClick={() => handleOpenLink(program)}
                                title={!getSignupLink(program) ? 'No signup link available' : 'Open signup page'}
                                disabled={!getSignupLink(program)}
                            >
                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                                Sign Up
                            </button>

                            <button
                                className={`affiliate-action-btn affiliate-action-btn--interested ${
                                    interestedPrograms.has(program._id) ? 'interested' : ''
                                }`}
                                onClick={() => handleMarkInterested(program._id)}
                                title={interestedPrograms.has(program._id) ? 'Marked as interested' : 'Mark as interested'}
                            >
                                <FontAwesomeIcon icon={interestedPrograms.has(program._id) ? faCheckCircle : faHeart} />
                                {interestedPrograms.has(program._id) ? 'Interested' : 'Mark Interested'}
                            </button>
                        </div>

                        <div className="affiliate-program-date">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <span>Added {new Date(program.dateAdded).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AffiliateProgramsTable;
