import { useState } from 'react';
import { trackContentInteraction } from '../utils/analytics';

import AccordianItem from './AccordianItem';

const FAQAccordian = () => {
    const [acc1Open, setAcc1Open] = useState(false);
    const [acc2Open, setAcc2Open] = useState(false);
    const [acc3Open, setAcc3Open] = useState(false);
    const [acc4Open, setAcc4Open] = useState(false);
    const [acc5Open, setAcc5Open] = useState(false);
    const [acc6Open, setAcc6Open] = useState(false);

    const handleFAQClick = (faqTitle: string, isOpening: boolean) => {
        trackContentInteraction('faq_click', faqTitle, isOpening ? 'open' : 'close', 'home');
    };

    return (
        <div className="faq-accordian__container">
            <AccordianItem
                title="What do I get with my subscription?"
                content="Your $20/month subscription gives you access to our database of 100+ verified newsletter sponsors. Each sponsor includes verified contact emails for decision makers at the sponsor company—usually high-value contacts like marketing directors, partnership managers, or other key decision makers—not generic email addresses. You also get company details, market types to help you find the right sponsors, email templates, and basic analytics to track your outreach."
                onPress={() => {
                    setAcc1Open(!acc1Open);
                    handleFAQClick("What do I get with my subscription?", !acc1Open);
                }}
                isOpen={acc1Open}
            />
            <AccordianItem
                title="How does sponsor matching work?"
                content="After completing your newsletter onboarding, we'll show you sponsors that match your newsletter's topic and audience. We match sponsors based on their market types and the information you provide about your newsletter (topic, audience demographics, etc.). Complete your newsletter profile to unlock personalized sponsor recommendations."
                onPress={() => {
                    setAcc2Open(!acc2Open);
                    handleFAQClick("How does sponsor matching work?", !acc2Open);
                }}
                isOpen={acc2Open}
            />
            <AccordianItem
                title="How much can I expect to earn from sponsorships?"
                content="Earnings vary significantly based on your audience size, engagement rate, and niche. Newsletter creators typically charge anywhere from $50 to $5,000+ per sponsorship depending on these factors. Our database helps you find sponsors actively looking to work with newsletters like yours."
                onPress={() => {
                    setAcc3Open(!acc3Open);
                    handleFAQClick("How much can I expect to earn from sponsorships?", !acc3Open);
                }}
                isOpen={acc3Open}
            />
            <AccordianItem
                title="Do you provide email templates?"
                content="Yes! We provide email templates that you can customize for your outreach. These templates are designed to help you introduce your newsletter and start a conversation with potential sponsors. You can personalize them with your newsletter details and audience information."
                onPress={() => {
                    setAcc4Open(!acc4Open);
                    handleFAQClick("Do you provide email templates?", !acc4Open);
                }}
                isOpen={acc4Open}
            />
            <AccordianItem
                title="Can I cancel my subscription anytime?"
                content="Absolutely! You can cancel your subscription at any time from your account settings. You'll continue to have access to all features until the end of your current billing period. No long-term contracts or hidden fees."
                onPress={() => {
                    setAcc5Open(!acc5Open);
                    handleFAQClick("Can I cancel my subscription anytime?", !acc5Open);
                }}
                isOpen={acc5Open}
            />
            <AccordianItem
                title="How do you source these sponsors?"
                content="We use proprietary software that continuously monitors newsletter sponsorships across a wide range of newsletters. When we identify a company sponsoring newsletters, our system automatically verifies and collects contact information for decision makers at those companies. This ensures our database stays current with active sponsors who are actively investing in newsletter partnerships."
                onPress={() => {
                    setAcc6Open(!acc6Open);
                    handleFAQClick("How do you source these sponsors?", !acc6Open);
                }}
                isOpen={acc6Open}
            />
        </div>
    );
}

export default FAQAccordian;