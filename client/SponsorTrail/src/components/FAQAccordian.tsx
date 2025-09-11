import { useState } from 'react';
import { trackContentInteraction } from '../utils/analytics';

import AccordianItem from './AccordianItem';

const FAQAccordian = () => {
    const [acc1Open, setAcc1Open] = useState(false);
    const [acc2Open, setAcc2Open] = useState(false);
    const [acc3Open, setAcc3Open] = useState(false);
    const [acc4Open, setAcc4Open] = useState(false);
    const [acc5Open, setAcc5Open] = useState(false);

    const handleFAQClick = (faqTitle: string, isOpening: boolean) => {
        trackContentInteraction('faq_click', faqTitle, isOpening ? 'open' : 'close', 'home');
    };

    return (
        <div className="faq-accordian__container">
            <AccordianItem
                title="How does the AI-powered sponsor matching work?"
                content="Our AI analyzes your newsletter's audience demographics, engagement rates, and content to match you with sponsors that are most likely to respond. We track response rates from similar newsletters to ensure you're reaching out to sponsors with proven success rates."
                onPress={() => {
                    setAcc1Open(!acc1Open);
                    handleFAQClick("How does the AI-powered sponsor matching work?", !acc1Open);
                }}
                isOpen={acc1Open}
            />
            <AccordianItem
                title="What's the difference between Basic and Pro plans?"
                content="Basic ($29/month) gives you access to 300+ verified sponsors, basic email templates, and simple analytics. Pro ($79/month) includes AI-powered matching, custom template generation, advanced response rate analytics, and revenue tracking to maximize your earnings."
                onPress={() => {
                    setAcc2Open(!acc2Open);
                    handleFAQClick("What's the difference between Basic and Pro plans?", !acc2Open);
                }}
                isOpen={acc2Open}
            />
            <AccordianItem
                title="How much can I expect to earn from sponsorships?"
                content="Earnings vary based on your audience size and engagement. Our users typically see 2-5x their monthly subscription cost in sponsorship revenue within the first month. The Pro plan's ROI tracking helps you optimize your outreach strategy for maximum earnings."
                onPress={() => {
                    setAcc3Open(!acc3Open);
                    handleFAQClick("How much can I expect to earn from sponsorships?", !acc3Open);
                }}
                isOpen={acc3Open}
            />
            <AccordianItem
                title="Do you provide email templates that actually work?"
                content="Yes! Our templates are based on successful outreach campaigns from newsletter creators who've closed deals. Pro users get access to our AI template generator that creates personalized emails based on your audience and the specific sponsor you're targeting."
                onPress={() => {
                    setAcc4Open(!acc4Open);
                    handleFAQClick("Do you provide email templates that actually work?", !acc4Open);
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
        </div>
    );
}

export default FAQAccordian;