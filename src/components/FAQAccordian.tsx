import { useState } from 'react';

import AccordianItem from './AccordianItem';

const FAQAccordian = () => {
    const [acc1Open, setAcc1Open] = useState(false);
    const [acc2Open, setAcc2Open] = useState(false);
    const [acc3Open, setAcc3Open] = useState(false);
    const [acc4Open, setAcc4Open] = useState(false);
    const [acc5Open, setAcc5Open] = useState(false);

    return (
        <div className="faq-accordian__container">
            <AccordianItem
                title="What is the cost of SponsorTrail?"
                content="Pricing is still being determined. However, we plan to offer a free trial period, allowing you to experience the benefits of SponsorTrail before committing to a subscription."
                onPress={() => setAcc1Open(!acc1Open)}
                isOpen={acc1Open}
            />
            <AccordianItem
                title="How often do I receive curated sponsorship lists?"
                content="Expect fresh and relevant sponsorship opportunities delivered weekly. Our curated lists provide access to the latest and most valuable opportunities for your podcast."
                onPress={() => setAcc2Open(!acc2Open)}
                isOpen={acc2Open}
            />
            <AccordianItem
                title="How can I apply for sponsorships?"
                content="Upon receiving your curated list, reaching out to potential sponsors is hassle-free. We provide contact information and tips for approaching these companies."
                onPress={() => setAcc3Open(!acc3Open)}
                isOpen={acc3Open}
            />
            <AccordianItem
                title="Are the sponsorships suitable for any podcast size?"
                content="Yes! Sponsorship opportunities are to your podcast's audience and niche, ensuring you receive relevant and valuable sponsorship opportunities."
                onPress={() => setAcc4Open(!acc4Open)}
                isOpen={acc4Open}
            />
            <AccordianItem
                title="How do we gather our data?"
                content="The majority of our information comes straight from podcasts themselves. In house software is constantly scanning the web for new sponsorships, ensuring our database is always up to date."
                onPress={() => setAcc5Open(!acc5Open)}
                isOpen={acc5Open}
            />
        </div>
    );
}

export default FAQAccordian;