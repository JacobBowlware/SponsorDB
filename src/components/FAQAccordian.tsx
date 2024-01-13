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
                title="How much will SponsorTrail cost?"
                content="Pricing is still being determined. However, we plan to offer a free trial period, allowing you to experience the benefits of SponsorTrail before committing to any subscription."
                onPress={() => setAcc1Open(!acc1Open)}
                isOpen={acc1Open}
            />
            <AccordianItem
                title="How often will I receive curated sponsorship lists?"
                content="Expect fresh and relevant sponsorship opportunities delivered weekly. Depending on your subscription plan, each curated list will contain 10-50+ sponsor opportunities. "
                onPress={() => setAcc2Open(!acc2Open)}
                isOpen={acc2Open}
            />
            <AccordianItem
                title="How can I apply for sponsorships?"
                content="Application links are provided for each sponsorship opportunity. Simply click the link and follow the instructions provided by the sponsor."
                onPress={() => setAcc3Open(!acc3Open)}
                isOpen={acc3Open}
            />
            <AccordianItem
                title="Are the sponsorships suitable for any podcast size?"
                content="Most large sponsors are looking for podcasts with 50,000+ downloads per month, though it heavily depends on the niche. "
                onPress={() => setAcc4Open(!acc4Open)}
                isOpen={acc4Open}
            />
            <AccordianItem
                title="How do we gather our data?"
                content="Our information primarily comes from podcasts themselves. In-house software continuously scans the web for new sponsorships, ensuring our database is always up to date."
                onPress={() => setAcc5Open(!acc5Open)}
                isOpen={acc5Open}
            />
        </div>
    );
}

export default FAQAccordian;