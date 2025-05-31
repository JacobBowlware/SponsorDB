import { useEffect, useState } from "react";
import config from '../../config';
import axios from "axios";

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faTrash, faEdit, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

interface Sponsor {
    newsletterSponsored: string;
    sponsorName: string;
    sponsorLink: string;
    tags: string[];
    subscriberCount: number;
    businessContact?: string;
    confidence: number
    _id: string;
}

interface BlogPost {
    _id: string;
    title: string;
    summary: string;
    content: string;
    slug: string;
    createdAt: string;
    published: boolean;
}

const Admin = () => {
    const [checked, setChecked] = useState(false);
    const [potentialSponsorAccordionClosed, setPotentialSponsorAccordionClosed] = useState(true);

    // Array of potential sponsors
    const [potentialSponsorData, setPotentialSponsorData] = useState([
        {
            newsletterSponsored: "",
            sponsorName: "",
            sponsorLink: "",
            tags: [""],
            subscriberCount: 0,
            businessContact: "",
            _id: "",
        }]);

    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState({
        title: '',
        content: '',
        summary: '',
        published: false
    });
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

    // Submit a sponsor to the database
    const handleSubmit = async (sponsor: any) => {
        try {
            // Create a new object with only the allowed fields
            const sponsorData = {
                sponsorName: sponsor.sponsorName,
                sponsorLink: sponsor.sponsorLink,
                tags: sponsor.tags,
                newsletterSponsored: sponsor.newsletterSponsored,
                subscriberCount: sponsor.subscriberCount,
                businessContact: sponsor.businessContact
            };
            
            await axios.post(`${config.backendUrl}sponsors/`, sponsorData,
                {
                    headers: {
                        'x-auth-token': localStorage.getItem('token')
                    }
                }).then(async (res) => {
                    // Remove the potential sponsor from the list
                    let tempSponsorData = [...potentialSponsorData];
                    tempSponsorData = tempSponsorData.filter((s) => s._id !== sponsor._id);
                    setPotentialSponsorData(tempSponsorData);
                }).catch((err) => {
                    console.log(err);
                })
        }
        catch (err) {
            console.log("Error Submitting Sponsor: ", err);
        }
    }

    // Delete the potential sponsor from the database
    const handleDeny = async (potentialSponsor: any) => {
        try {
            await axios.delete(`${config.backendUrl}potentialSponsors/${potentialSponsor._id}`,
                {
                    headers: {
                        'x-auth-token': localStorage.getItem('token')
                    }
                }).then((res) => {
                    console.log(res);
                    let tempSponsorData = [...potentialSponsorData];
                    tempSponsorData = tempSponsorData.filter((sponsor) => sponsor._id !== potentialSponsor._id);
                    setPotentialSponsorData(tempSponsorData);
                }).catch((err) => {
                    console.log(err);
                })
        }
        catch (err) {
            console.log("Error Deleting Sponsor: ", err);
        }

    }

    // Get all potential sponsors from the database
    const getSponsorData = async () => {
        if (checked) {
            return;
        }

        await axios.get(`${config.backendUrl}potentialSponsors/`,
            {
                headers: {
                    'x-auth-token': localStorage.getItem('token')
                }
            }).then((res) => {
                const potentialSponsorData = res.data;
                console.log(res.data);

                setPotentialSponsorData(potentialSponsorData);
                setChecked(true);

                // Sort by confidence score
                const sortedData = potentialSponsorData.sort((a: Sponsor, b: Sponsor) => {
                    return b.confidence - a.confidence;
                });
                setPotentialSponsorData(sortedData);

            }).catch((err) => {
                console.log(err);
                return [];
            })
    }

    useEffect(() => {
        const fetchData = async () => {
            // call backend to get all potential sponsors
            await getSponsorData();
        }

        if (potentialSponsorData.length === 1) {
            fetchData();
        }
    }, [getSponsorData, setPotentialSponsorData]);

    useEffect(() => {
        fetchBlogPosts();
    }, []);

    const fetchBlogPosts = async () => {
        try {
            const response = await axios.get(`${config.backendUrl}blog/admin/all`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setBlogPosts(response.data);
        } catch (error) {
            console.error('Error fetching blog posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${config.backendUrl}blog`, newPost, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setNewPost({ title: '', content: '', summary: '', published: false });
            fetchBlogPosts();
        } catch (error) {
            console.error('Error creating blog post:', error);
        }
    };

    const handleUpdatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPost) return;

        try {
            await axios.put(`${config.backendUrl}blog/${editingPost._id}`, editingPost, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            setEditingPost(null);
            fetchBlogPosts();
        } catch (error) {
            console.error('Error updating blog post:', error);
        }
    };

    const handleDeletePost = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            await axios.delete(`${config.backendUrl}blog/${id}`, {
                headers: { 'x-auth-token': localStorage.getItem('token') }
            });
            fetchBlogPosts();
        } catch (error) {
            console.error('Error deleting blog post:', error);
        }
    };

    const handleTogglePublish = async (post: BlogPost) => {
        try {
            await axios.put(`${config.backendUrl}blog/${post._id}`, 
                { ...post, published: !post.published },
                { headers: { 'x-auth-token': localStorage.getItem('token') } }
            );
            fetchBlogPosts();
        } catch (error) {
            console.error('Error toggling post publish status:', error);
        }
    };

    return (
        <div className="web-page">
            <div className="web-section admin" id="">
                <div className="admin-header__cont web-section-content">
                    <h1 className="admin-header">
                        <strong>Admin Dashboard</strong>
                    </h1>
                </div>
                <div className="admin-dash__cont web-section-content">
                    <p className="admin-dash__text">
                        View all <strong> Potential Sponsors</strong> currently in the database. ({potentialSponsorData.length})
                    </p>
                    <div className="admin-dash__form-accordian-container">
                        <div className="admin-dash__form-accordian" onClick={() => {
                            const element = document.querySelector(".admin-dash__form") as HTMLElement;
                            element.classList.toggle("active");
                            setPotentialSponsorAccordionClosed(!potentialSponsorAccordionClosed);
                        }}>
                            <h2 className="admin-dash__form-accordian-header-text">Potential Sponsors</h2>
                            <FontAwesomeIcon icon={potentialSponsorAccordionClosed ? faChevronDown : faChevronUp} className="admin-dash__form-accordian-icon" />
                        </div>
                        {(potentialSponsorData.length === 0) ? <h2 className="admin-dash__form-header">No Potential Sponsors in Database.</h2> :
                            <><form className="admin-dash__form">
                                {potentialSponsorData.map((sponsorData, index) => {
                                    return <div className="admin-dash__form-item">
                                        <div className="admin-dash__form-input-container">
                                            <input
                                                placeholder="Newsletter"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    let tempSponsorData = [...potentialSponsorData];
                                                    tempSponsorData[index].newsletterSponsored = e.target.value;
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.newsletterSponsored}
                                            />
                                            <input
                                                placeholder="Sponsor"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    let tempSponsorData = [...potentialSponsorData];
                                                    tempSponsorData[index].sponsorName = e.target.value;
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.sponsorName}
                                            />
                                        </div>
                                        <div className="admin-dash__form-input-container">
                                            <input
                                                placeholder="Sponsor Link"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    let tempSponsorData = [...potentialSponsorData];
                                                    tempSponsorData[index].sponsorLink = e.target.value;
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.sponsorLink}
                                            />
                                            <input
                                                placeholder="tag1, tag2"
                                                className="admin-dash__form-input"
                                                onKeyDown={(e) => {
                                                    if (e.key === ' ' || e.key === 'Tab') {
                                                        e.preventDefault(); // Prevent space or tab
                                                    }
                                                }}
                                                onChange={(e) => {
                                                    let tempSponsorData = [...potentialSponsorData];
                                                    tempSponsorData[index].tags = e.target.value.split(",");
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.tags}
                                            />
                                        </div>
                                        <div className="admin-dash__form-input-container">
                                            <input
                                                placeholder="Subscriber Count"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    const updatedSubscriberCount = Number(e.target.value);
                                                    // Copy subscriber count to all sponsors that have the same newsletterSponsored field
                                                    if (updatedSubscriberCount > 0) {
                                                        const tempSponsorData = potentialSponsorData.map((sponsor, idx) => {
                                                            return sponsorData.newsletterSponsored === sponsor.newsletterSponsored
                                                                ? { ...sponsor, subscriberCount: updatedSubscriberCount }
                                                                : sponsor;
                                                        });
                                                        setPotentialSponsorData(tempSponsorData);
                                                    }
                                                }}
                                                value={sponsorData.subscriberCount}
                                            />
                                            <input
                                                placeholder="Apply for Sponsorship"
                                                className="admin-dash__form-input"
                                                onChange={(e) => {
                                                    // Copy Apply for Sponsorship to all sponsors that have the same sponsorName field
                                                    const tempSponsorData = potentialSponsorData.map((sponsor, idx) => {
                                                        return sponsorData.sponsorName === sponsor.sponsorName
                                                            ? { ...sponsor, businessContact: e.target.value }
                                                            : sponsor;
                                                    });
                                                    setPotentialSponsorData(tempSponsorData);
                                                }}
                                                value={sponsorData.businessContact}
                                            />
                                        </div>
                                        <div className="admin-dash__form-btn-container">
                                            <button type="button" onClick={async () => {
                                                // Submit the sponsor to DB
                                                await handleSubmit(sponsorData);
                                                // Remove the potential sponsor from the list
                                                setPotentialSponsorData(potentialSponsorData.filter((_, i) => i !== index));
                                                // Remove from DB
                                                await handleDeny(sponsorData);
                                            }}
                                                className="btn admin-dash__form-btn">
                                                APPROVE
                                            </button>
                                            <button type="button" onClick={async () => {
                                                // Remove from DB
                                                await handleDeny(sponsorData)
                                            }} className="btn admin-dash__form-btn">
                                                DENY
                                            </button>
                                        </div>
                                    </div>
                                })}
                            </form>
                            </>}
                    </div>
                </div>
            </div>

            <div className="admin-container">
                <h1 className="admin-header">Admin Dashboard</h1>
                
                <div className="admin-section">
                    <h2 className="admin-section__header">Create New Blog Post</h2>
                    <form onSubmit={handleCreatePost} className="admin-form">
                        <input
                            type="text"
                            placeholder="Title"
                            value={newPost.title}
                            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                            className="admin-input"
                            required
                        />
                        <textarea
                            placeholder="Summary"
                            value={newPost.summary}
                            onChange={(e) => setNewPost({ ...newPost, summary: e.target.value })}
                            className="admin-textarea"
                            required
                        />
                        <textarea
                            placeholder="Content"
                            value={newPost.content}
                            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                            className="admin-textarea admin-textarea--large"
                            required
                        />
                        <div className="admin-form__footer">
                            <label className="admin-checkbox">
                                <input
                                    type="checkbox"
                                    checked={newPost.published}
                                    onChange={(e) => setNewPost({ ...newPost, published: e.target.checked })}
                                />
                                Publish immediately
                            </label>
                            <button type="submit" className="admin-btn">Create Post</button>
                        </div>
                    </form>
                </div>

                <div className="admin-section">
                    <h2 className="admin-section__header">Manage Blog Posts</h2>
                    {loading ? (
                        <div className="admin-loading">Loading...</div>
                    ) : (
                        <div className="admin-posts">
                            {blogPosts.map((post) => (
                                <div key={post._id} className="admin-post">
                                    <div className="admin-post__content">
                                        <h3 className="admin-post__title">{post.title}</h3>
                                        <p className="admin-post__summary">{post.summary}</p>
                                        <div className="admin-post__meta">
                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                            <span className={`admin-post__status ${post.published ? 'published' : 'draft'}`}>
                                                {post.published ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="admin-post__actions">
                                        <button
                                            onClick={() => handleTogglePublish(post)}
                                            className="admin-btn admin-btn--icon"
                                            title={post.published ? 'Unpublish' : 'Publish'}
                                        >
                                            <FontAwesomeIcon icon={post.published ? faEyeSlash : faEye} />
                                        </button>
                                        <button
                                            onClick={() => setEditingPost(post)}
                                            className="admin-btn admin-btn--icon"
                                            title="Edit"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePost(post._id)}
                                            className="admin-btn admin-btn--icon admin-btn--danger"
                                            title="Delete"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {editingPost && (
                    <div className="admin-modal">
                        <div className="admin-modal__content">
                            <h2 className="admin-modal__header">Edit Post</h2>
                            <form onSubmit={handleUpdatePost} className="admin-form">
                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={editingPost.title}
                                    onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                                    className="admin-input"
                                    required
                                />
                                <textarea
                                    placeholder="Summary"
                                    value={editingPost.summary}
                                    onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
                                    className="admin-textarea"
                                    required
                                />
                                <textarea
                                    placeholder="Content"
                                    value={editingPost.content}
                                    onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                                    className="admin-textarea admin-textarea--large"
                                    required
                                />
                                <div className="admin-form__footer">
                                    <label className="admin-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={editingPost.published}
                                            onChange={(e) => setEditingPost({ ...editingPost, published: e.target.checked })}
                                        />
                                        Published
                                    </label>
                                    <div className="admin-form__actions">
                                        <button type="submit" className="admin-btn">Save Changes</button>
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn--secondary"
                                            onClick={() => setEditingPost(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin;